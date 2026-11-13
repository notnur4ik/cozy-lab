import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { AuthorizationError, assertPermission } from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { writeAuditLog } from '@/lib/security/audit';
import { apiErrorResponse, verifySameOrigin } from '@/lib/security/api-helpers';

const branchMutationSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80),
  name: z.string().min(2).max(160),
  address: z.string().min(4).max(300),
  is_verified_address: z.boolean().default(false),
  phone: z.string().max(40).nullable().optional(),
  whatsapp_phone: z.string().max(40).nullable().optional(),
  instagram_url: z.string().url().nullable().optional(),
  working_hours: z.record(z.string()).default({}),
  is_active: z.boolean().default(true),
});

export async function GET() {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ branches: [] });

    let query = admin.from('branches').select('*').order('sort_order');
    if (staff.role !== 'OWNER' && staff.branch_ids.length > 0) {
      query = query.in('id', staff.branch_ids);
    }

    const { data } = await query;
    return NextResponse.json({ branches: data ?? [] });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = assertPermission(await getAuthenticatedStaff(), 'branches.manage');
    const body = await request.json().catch(() => null);
    const parsed = branchMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 422 }
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: { code: 'DATABASE_NOT_CONFIGURED' } }, { status: 503 });

    const { id, ...fields } = parsed.data;
    const { data, error } = id
      ? await admin.from('branches').update(fields).eq('id', id).select('*').single()
      : await admin.from('branches').insert(fields).select('*').single();

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 400 });
    }

    await writeAuditLog({
      actorId: staff.id,
      actorRole: staff.role,
      action: id ? 'BRANCH_UPDATED' : 'BRANCH_CREATED',
      entityType: 'branch',
      entityId: data.id,
      branchId: data.id,
      metadata: { slug: data.slug, is_active: data.is_active },
    });

    revalidateTag('catalog');
    return NextResponse.json({ branch: data }, { status: id ? 200 : 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
