import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type { StaffProfile } from '@/types/domain';

/**
 * Resolves the currently authenticated CRM staff user and their assigned branches.
 * Always validates against the server-side Supabase session + profiles table.
 */
export async function getAuthenticatedStaff(): Promise<StaffProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, phone, role, is_active, mfa_enabled, preferred_locale')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;

  const { data: branches } = await admin
    .from('branch_managers')
    .select('branch_id')
    .eq('profile_id', profile.id);

  const { data: emp } = await admin
    .from('employees')
    .select('branch_id')
    .eq('profile_id', profile.id)
    .maybeSingle();

  const branchIds = new Set<string>((branches ?? []).map((b) => b.branch_id));
  if (emp?.branch_id) branchIds.add(emp.branch_id);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    role: profile.role,
    is_active: profile.is_active,
    mfa_enabled: profile.mfa_enabled,
    preferred_locale: profile.preferred_locale,
    branch_ids: Array.from(branchIds),
  };
}
