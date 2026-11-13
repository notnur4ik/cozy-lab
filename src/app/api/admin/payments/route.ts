import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { assertBranchAccess, assertPermission } from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { recordPaymentSchema } from '@/lib/validation/schemas';
import { writeAuditLog } from '@/lib/security/audit';
import {
  apiErrorResponse,
  handleRouteError,
  storeIdempotencyResult,
  validateReplayAndIdempotency,
  verifySameOrigin,
} from '@/lib/security/api-helpers';

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = assertPermission(await getAuthenticatedStaff(), 'payments.record');
    const gate = await validateReplayAndIdempotency(request, '/api/admin/payments', {
      requireIdempotencyKey: true,
    });
    if (!gate.ok) return gate.response;

    const parsed = recordPaymentSchema.safeParse(gate.ctx.jsonBody);
    if (!parsed.success) {
      return apiErrorResponse(422, 'VALIDATION_ERROR', 'Invalid payment payload.', parsed.error.flatten());
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return apiErrorResponse(503, 'DATABASE_NOT_CONFIGURED', 'Database is not configured.');
    }

    const { data: appt } = await admin
      .from('appointments')
      .select('id, branch_id')
      .eq('id', parsed.data.appointmentId)
      .maybeSingle();

    if (!appt) {
      return apiErrorResponse(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found.');
    }

    assertBranchAccess(staff, appt.branch_id);

    const { data: payment, error } = await admin
      .from('payments')
      .insert({
        appointment_id: parsed.data.appointmentId,
        branch_id: appt.branch_id,
        payment_method_id: parsed.data.paymentMethodId,
        amount_kzt: parsed.data.amountKzt,
        recorded_by: staff.id,
        notes: parsed.data.notes ?? null,
      })
      .select('*')
      .single();

    if (error) {
      return apiErrorResponse(500, 'PAYMENT_INSERT_FAILED', error.message);
    }

    await writeAuditLog({
      actorId: staff.id,
      actorRole: staff.role,
      action: 'PAYMENT_RECORDED',
      entityType: 'payment',
      entityId: payment.id,
      branchId: appt.branch_id,
      metadata: {
        appointmentId: parsed.data.appointmentId,
        amountKzt: parsed.data.amountKzt,
      },
    });

    const responseBody = { payment };
    if (gate.ctx.idempotencyKey) {
      await storeIdempotencyResult(
        gate.ctx.idempotencyKey,
        '/api/admin/payments',
        gate.ctx.bodyText,
        201,
        responseBody
      );
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
