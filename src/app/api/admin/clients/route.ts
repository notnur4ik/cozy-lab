import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { assertPermission } from '@/lib/security/rbac';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { handleRouteError } from '@/lib/security/api-helpers';

export async function GET(request: NextRequest) {
  try {
    assertPermission(await getAuthenticatedStaff(), 'clients.manage');
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ clients: [] });

    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get('q')?.trim() ?? '';
    // Strip PostgREST filter syntax characters to prevent filter injection
    const safeSearch = rawSearch.replace(/[,().%_*\\]/g, '').slice(0, 80);

    let query = admin
      .from('clients')
      .select('*, appointments(id, status, starts_at, price_kzt)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (safeSearch) {
      query = query.or(`full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
    }

    const { data } = await query;
    return NextResponse.json({ clients: data ?? [] });
  } catch (err) {
    return handleRouteError(err);
  }
}
