import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { AuthorizationError, assertPermission } from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { writeAuditLog } from '@/lib/security/audit';
import { apiErrorResponse, verifySameOrigin } from '@/lib/security/api-helpers';

const i18nSchema = z.object({
  ru: z.string(),
  kk: z.string(),
  en: z.string(),
});

const serviceMutationSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  slug: z.string().min(2).max(100),
  name_i18n: i18nSchema,
  description_i18n: i18nSchema,
  price_kzt: z.number().int().min(0).nullable().optional(),
  is_price_verified: z.boolean().default(false),
  duration_minutes: z.number().int().min(5).max(600),
  is_popular: z.boolean().default(false),
  is_active: z.boolean().default(true),
  archive: z.boolean().optional(),
});

export async function GET() {
  const staff = await getAuthenticatedStaff();
  if (!staff) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ services: [], categories: [] });

  const [servicesRes, categoriesRes] = await Promise.all([
    admin.from('services').select('*').is('archived_at', null).order('created_at', { ascending: false }),
    admin.from('service_categories').select('*').order('sort_order'),
  ]);

  return NextResponse.json({
    services: servicesRes.data ?? [],
    categories: categoriesRes.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = assertPermission(await getAuthenticatedStaff(), 'services.manage');
    const body = await request.json().catch(() => null);
    const parsed = serviceMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 422 }
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: { code: 'DATABASE_NOT_CONFIGURED' } }, { status: 503 });

    const { id, archive, ...fields } = parsed.data;
    if (id && archive) {
      const { data, error } = await admin
        .from('services')
        .update({ archived_at: new Date().toISOString(), is_active: false })
        .eq('id', id)
        .select('*')
        .single();

      if (error) return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 400 });

      await writeAuditLog({
        actorId: staff.id,
        actorRole: staff.role,
        action: 'SERVICE_ARCHIVED',
        entityType: 'service',
        entityId: id,
      });

      revalidateTag('catalog');
      return NextResponse.json({ service: data });
    }

    const { data, error } = id
      ? await admin.from('services').update(fields).eq('id', id).select('*').single()
      : await admin.from('services').insert(fields).select('*').single();

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 400 });
    }

    await writeAuditLog({
      actorId: staff.id,
      actorRole: staff.role,
      action: id ? 'SERVICE_UPDATED' : 'SERVICE_CREATED',
      entityType: 'service',
      entityId: data.id,
      metadata: { price_kzt: data.price_kzt, duration_minutes: data.duration_minutes },
    });

    revalidateTag('catalog');
    return NextResponse.json({ service: data }, { status: id ? 200 : 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
