import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { assertBranchAccess } from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { apiErrorResponse, handleRouteError } from '@/lib/security/api-helpers';
import { uuidSchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return apiErrorResponse(401, 'UNAUTHORIZED', 'Authentication required.');

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({
        summary: {
          totalAppointments: 0,
          newCount: 0,
          pendingCount: 0,
          confirmedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          noShowCount: 0,
          revenueKzt: 0,
          averageTransactionKzt: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const fromIso = searchParams.get('from');
    const toIso = searchParams.get('to');

    if (branchId) {
      if (!uuidSchema.safeParse(branchId).success) {
        return apiErrorResponse(400, 'INVALID_BRANCH_ID', 'Invalid branchId.');
      }
      if (staff.role !== 'OWNER') {
        assertBranchAccess(staff, branchId);
      }
    }

    const canViewFinancials = staff.role === 'OWNER' || staff.role === 'MANAGER';

    let apptQuery = admin.from('appointments').select('id, status, branch_id');
    let payQuery = canViewFinancials ? admin.from('payments').select('amount_kzt, branch_id') : null;

    if (staff.role !== 'OWNER') {
      const allowed = branchId ? [branchId] : staff.branch_ids;
      if (allowed.length === 0) {
        return NextResponse.json({
          summary: {
            totalAppointments: 0,
            newCount: 0,
            pendingCount: 0,
            confirmedCount: 0,
            completedCount: 0,
            cancelledCount: 0,
            noShowCount: 0,
            revenueKzt: canViewFinancials ? 0 : null,
            averageTransactionKzt: 0,
          },
        });
      }
      apptQuery = apptQuery.in('branch_id', allowed);
      if (payQuery) payQuery = payQuery.in('branch_id', allowed);
    } else if (branchId) {
      apptQuery = apptQuery.eq('branch_id', branchId);
      if (payQuery) payQuery = payQuery.eq('branch_id', branchId);
    }

    if (fromIso && !Number.isNaN(Date.parse(fromIso))) {
      apptQuery = apptQuery.gte('starts_at', fromIso);
      if (payQuery) payQuery = payQuery.gte('paid_at', fromIso);
    }
    if (toIso && !Number.isNaN(Date.parse(toIso))) {
      apptQuery = apptQuery.lte('starts_at', toIso);
      if (payQuery) payQuery = payQuery.lte('paid_at', toIso);
    }

    const [apptsRes, paysRes] = await Promise.all([
      apptQuery,
      payQuery ?? Promise.resolve({ data: [] as Array<{ amount_kzt: number | null }> }),
    ]);

    const appts = apptsRes.data ?? [];
    const pays = paysRes.data ?? [];

    const revenueKzt = canViewFinancials
      ? pays.reduce((sum, p) => sum + (p.amount_kzt ?? 0), 0)
      : null;

    const averageTransactionKzt =
      revenueKzt !== null && pays.length > 0 ? Math.round(revenueKzt / pays.length) : 0;

    return NextResponse.json({
      summary: {
        totalAppointments: appts.length,
        newCount: appts.filter((a) => a.status === 'NEW').length,
        pendingCount: appts.filter((a) => a.status === 'PENDING').length,
        confirmedCount: appts.filter((a) => a.status === 'CONFIRMED').length,
        completedCount: appts.filter((a) => a.status === 'COMPLETED').length,
        cancelledCount: appts.filter((a) => a.status === 'CANCELLED').length,
        noShowCount: appts.filter((a) => a.status === 'NO_SHOW').length,
        revenueKzt,
        averageTransactionKzt,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
