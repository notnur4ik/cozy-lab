import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { AuthorizationError, assertPermission } from '@/lib/security/rbac';
import { validateImageUpload } from '@/lib/security/upload';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { apiErrorResponse, verifySameOrigin } from '@/lib/security/api-helpers';

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
      return apiErrorResponse(403, 'CSRF_ORIGIN_MISMATCH', 'Cross-origin request rejected.');
    }
    const staff = assertPermission(await getAuthenticatedStaff(), 'employees.manage');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: { code: 'FILE_REQUIRED' } }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const check = validateImageUpload(bytes, file.type);

    if (!check.ok || !check.storageKey || !check.mime) {
      return NextResponse.json(
        { error: { code: 'INVALID_UPLOAD', message: check.error } },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({ error: { code: 'STORAGE_NOT_CONFIGURED' } }, { status: 503 });
    }

    const { error } = await admin.storage
      .from('cozy-lab-media')
      .upload(check.storageKey, bytes, {
        contentType: check.mime,
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: { code: 'UPLOAD_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    const { data: pub } = admin.storage.from('cozy-lab-media').getPublicUrl(check.storageKey);

    return NextResponse.json(
      {
        storageKey: check.storageKey,
        publicUrl: pub.publicUrl,
        uploadedBy: staff.id,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: { code: err.code } }, { status: err.status });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
