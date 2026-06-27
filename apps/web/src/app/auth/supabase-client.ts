import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client, created only when both env vars are present. When
 * unset, the app falls back to the backend dev-login (see auth-context).
 *
 * Set in .env:
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon public key>
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
