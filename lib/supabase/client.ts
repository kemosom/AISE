import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Reads from either Next.js NEXT_PUBLIC_* or Vite VITE_* environment variables
export const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return (
      (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL ||
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
      ''
    );
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
};

export const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    return (
      (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    );
  }
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url !== 'https://your-project.supabase.co' && !url.includes('example.com'));
};

let browserClient: SupabaseClient | null = null;

/**
 * Creates or retrieves the singleton browser Supabase client.
 * Official Supabase JS client for client-side queries and authentication.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export const supabase = {
  get client(): SupabaseClient | null {
    return getSupabaseBrowserClient();
  },
  isConfigured: isSupabaseConfigured,
};
