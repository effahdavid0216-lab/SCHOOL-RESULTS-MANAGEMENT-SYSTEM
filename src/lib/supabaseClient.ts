import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

function getValidSupabaseUrl(rawUrl?: string): string {
  const fallback = 'https://placeholder-supabase-project.supabase.co';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function getValidSupabaseKey(rawKey?: string): string {
  if (!rawKey || typeof rawKey !== 'string') return 'placeholder-anon-key';
  const trimmed = rawKey.trim();
  return trimmed || 'placeholder-anon-key';
}

const supabaseUrl = getValidSupabaseUrl(metaEnv.VITE_SUPABASE_URL);
const supabaseAnonKey = getValidSupabaseKey(metaEnv.VITE_SUPABASE_ANON_KEY);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'edumaster-school-management',
    },
  },
});

export const isSupabaseConfigured = (): boolean => {
  const url = metaEnv.VITE_SUPABASE_URL;
  const key = metaEnv.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url !== 'https://placeholder-supabase-project.supabase.co' &&
    key !== 'placeholder-anon-key' &&
    url.startsWith('http')
  );
};

export default supabase;
