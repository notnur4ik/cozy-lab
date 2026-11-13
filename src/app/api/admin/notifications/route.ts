import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { assertBranchAccess } from '@/lib/security/rbac';
import { uuidSchema } from '@/lib/validation/schemas';
import { apiErrorResponse, handleRouteError, verifySameOrigin } from '@/lib/security/api-helpers';

export async function GET() {
  const staff = await getAuthenticatedStaff();
  if (!staff) return apiErrorResponse(401, 'UNAUTHORIZED', 'Authentication required.');

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ notifications: [] });

  let query = admin
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (staff.role !== 'OWNER' && staff.branch_ids.length > 0) {
    query = query.in('branch_id', staff.branch_ids);
  } else if (staff.role !== 'OWNER') {
    return NextResponse.json({ notifications: [] });
  }

  const { data } = await query;
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = await getAuthenticatedStaff();
    if (!staff) return apiErrorResponse(401, 'UNAUTHORIZED', 'Authentication required.');

    const body = (await request.json().catch(() => null)) as { id?: string } | null;
    if (!body?.id || !uuidSchema.safeParse(body.id).success) {
      return apiErrorResponse(400, 'VALIDATION_ERROR', 'Valid notification ID is required.');
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return apiErrorResponse(503, 'DATABASE_NOT_CONFIGURED', 'Database not configured.');

    const { data: notif } = await admin
      .from('notifications')
      .select('id, branch_id, recipient_profile_id')
      .eq('id', body.id)
      .maybeSingle();

    if (!notif) {
      return apiErrorResponse(404, 'NOT_FOUND', 'Notification not found.');
    }

    if (notif.branch_id) {
      assertBranchAccess(staff, notif.branch_id);
    } else if (notif.recipient_profile_id && notif.recipient_profile_id !== staff.id && staff.role !== 'OWNER') {
      return apiErrorResponse(403, 'FORBIDDEN', 'Cannot modify another user notification.');
    }

    await admin.from('notifications').update({ is_read: true }).eq('id', body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
