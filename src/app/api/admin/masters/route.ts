import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import {
  AuthorizationError,
  assertBranchAccess,
  assertPermission,
} from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { writeAuditLog } from '@/lib/security/audit';
import { apiErrorResponse, verifySameOrigin } from '@/lib/security/api-helpers';

const masterMutationSchema = z.object({
  id: z.string().uuid().optional(),
  branch_id: z.string().uuid(),
  full_name: z.string().min(2).max(160),
  specialization_i18n: z.object({ ru: z.string(), kk: z.string(), en: z.string() }),
  bio_i18n: z.object({ ru: z.string(), kk: z.string(), en: z.string() }),
  experience_years: z.number().int().min(0).max(60).nullable().optional(),
  experience_verified: z.boolean().default(false),
  photo_url: z.string().url().nullable().optional(),
  is_master: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export async function GET() {
  const staff = await getAuthenticatedStaff();
  if (!staff) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ masters: [] });

  let query = admin.from('employees').select('*').order('created_at', { ascending: false });
  if (staff.role !== 'OWNER' && staff.branch_ids.length > 0) {
    query = query.in('branch_id', staff.branch_ids);
  }

  const { data } = await query;
  return NextResponse.json({ masters: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = assertPermission(await getAuthenticatedStaff(), 'employees.manage');
    const body = await request.json().catch(() => null);
    const parsed = masterMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 422 }
      );
    }

    assertBranchAccess(staff, parsed.data.branch_id);

    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: { code: 'DATABASE_NOT_CONFIGURED' } }, { status: 503 });

    const { id, ...fields } = parsed.data;
    const { data, error } = id
      ? await admin.from('employees').update(fields).eq('id', id).select('*').single()
      : await admin.from('employees').insert(fields).select('*').single();

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 400 });
    }

    await writeAuditLog({
      actorId: staff.id,
      actorRole: staff.role,
      action: id ? 'EMPLOYEE_UPDATED' : 'EMPLOYEE_CREATED',
      entityType: 'employee',
      entityId: data.id,
      branchId: data.branch_id,
    });

    revalidateTag('catalog');
    return NextResponse.json({ master: data }, { status: id ? 200 : 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
