import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

/**
 * Server-only privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Must NEVER be imported in client components.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY_VIOLATION: Admin client cannot be initialized in the browser.');
  }

  const { supabaseUrl, serviceRoleKey, isServiceRoleConfigured } = getServerEnv();
  if (!isServiceRoleConfigured) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
