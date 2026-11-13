import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import {
  AuthorizationError,
  assertBranchAccess,
  assertPermission,
} from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { createBookingSchema } from '@/lib/validation/schemas';
import { createBooking } from '@/server/services/booking-service';
import { apiErrorResponse, verifySameOrigin } from '@/lib/security/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({ appointments: [] });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const fromIso = searchParams.get('from');
    const toIso = searchParams.get('to');

    let query = admin
      .from('appointments')
      .select(
        `
        *,
        clients(id, full_name, phone),
        services(id, name_i18n, duration_minutes),
        employees(id, full_name),
        branches(id, name)
      `
      )
      .order('starts_at', { ascending: true });

    if (staff.role === 'MASTER') {
      const { data: ownEmp } = await admin
        .from('employees')
        .select('id')
        .eq('profile_id', staff.id)
        .maybeSingle();
      if (!ownEmp) return NextResponse.json({ appointments: [] });
      query = query.eq('employee_id', ownEmp.id);
    } else if (staff.role !== 'OWNER') {
      if (branchId) {
        assertBranchAccess(staff, branchId);
        query = query.eq('branch_id', branchId);
      } else if (staff.branch_ids.length > 0) {
        query = query.in('branch_id', staff.branch_ids);
      } else {
        return NextResponse.json({ appointments: [] });
      }
    } else if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (status) query = query.eq('status', status);
    if (fromIso && !Number.isNaN(Date.parse(fromIso))) query = query.gte('starts_at', fromIso);
    if (toIso && !Number.isNaN(Date.parse(toIso))) query = query.lte('starts_at', toIso);

    const { data, error } = await query.limit(250);
    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Failed to load appointments.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointments: data ?? [] });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = assertPermission(await getAuthenticatedStaff(), 'appointments.manage');
    const body = await request.json().catch(() => null);
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 422 }
      );
    }

    assertBranchAccess(staff, parsed.data.branchId);
    const result = await createBooking({
      ...parsed.data,
      source: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      result.ok ? { booking: result.booking } : { error: { code: result.code, message: result.message } },
      { status: result.status }
    );
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
