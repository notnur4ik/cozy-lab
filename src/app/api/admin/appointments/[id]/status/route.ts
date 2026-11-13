import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { assertBranchAccess, assertPermission } from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { transitionStatusSchema, uuidSchema } from '@/lib/validation/schemas';
import { writeAuditLog } from '@/lib/security/audit';
import {
  apiErrorResponse,
  handleRouteError,
  storeIdempotencyResult,
  validateReplayAndIdempotency,
  verifySameOrigin,
} from '@/lib/security/api-helpers';
import type { AppointmentStatus } from '@/types/domain';

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  NEW: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }

    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) {
      return apiErrorResponse(400, 'INVALID_ID', 'Invalid appointment ID format.');
    }

    const staff = assertPermission(await getAuthenticatedStaff(), 'appointments.manage');
    const endpoint = `/api/admin/appointments/${id}/status`;
    const gate = await validateReplayAndIdempotency(request, endpoint, {
      requireIdempotencyKey: true,
    });
    if (!gate.ok) return gate.response;

    const parsed = transitionStatusSchema.safeParse(gate.ctx.jsonBody);
    if (!parsed.success) {
      return apiErrorResponse(422, 'VALIDATION_ERROR', 'Invalid status payload.', parsed.error.flatten());
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return apiErrorResponse(503, 'DATABASE_NOT_CONFIGURED', 'Database is not configured.');
    }

    const { data: existing } = await admin
      .from('appointments')
      .select('id, branch_id, status')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return apiErrorResponse(404, 'NOT_FOUND', 'Appointment not found.');
    }

    assertBranchAccess(staff, existing.branch_id);

    const currentStatus = existing.status as AppointmentStatus;
    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(parsed.data.status)) {
      return apiErrorResponse(
        409,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition appointment from ${currentStatus} to ${parsed.data.status}.`
      );
    }

    const { data, error } = await admin.rpc('transition_appointment_status', {
      p_appointment_id: id,
      p_new_status: parsed.data.status,
      p_changed_by: staff.id,
      p_reason: parsed.data.reason ?? null,
    });

    if (error) {
      const isDup = error.message?.includes('DUPLICATE_STATUS_TRANSITION');
      return apiErrorResponse(
        isDup ? 409 : 400,
        isDup ? 'DUPLICATE_STATUS_TRANSITION' : 'TRANSITION_FAILED',
        error.message
      );
    }

    await writeAuditLog({
      actorId: staff.id,
      actorRole: staff.role,
      action: 'APPOINTMENT_STATUS_CHANGED',
      entityType: 'appointment',
      entityId: id,
      branchId: existing.branch_id,
      metadata: {
        previousStatus: existing.status,
        newStatus: parsed.data.status,
        reason: parsed.data.reason ?? null,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });

    const payload = { transition: Array.isArray(data) ? data[0] : data };
    if (gate.ctx.idempotencyKey) {
      await storeIdempotencyResult(gate.ctx.idempotencyKey, endpoint, gate.ctx.bodyText, 200, payload);
    }

    return NextResponse.json(payload);
  } catch (err) {
    return handleRouteError(err);
  }
}
