import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } = getPublicEnv();
  if (!isSupabaseConfigured) {
    throw new Error('Supabase public environment variables are not configured.');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
