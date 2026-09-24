import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseServerUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  );
}

export function getSupabaseServerKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
}

export function isSupabaseServerConfigured(): boolean {
  const url = getSupabaseServerUrl();
  const key = getSupabaseServerKey();
  return Boolean(url && key && url !== 'https://your-project.supabase.co' && !url.includes('example.com'));
}

/**
 * Creates a Supabase client for server-side operations.
 * When an auth token is provided, requests are made in the context of that authenticated user.
 */
export function createSupabaseServerClient(authToken?: string): SupabaseClient | null {
  const url = getSupabaseServerUrl();
  const key = getSupabaseServerKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    },
  });
}

/**
 * Retrieves the authenticated user profile on the server.
 */
export async function getAuthenticatedUserFromServer(authToken: string | undefined | null) {
  if (!authToken || !isSupabaseServerConfigured()) {
    return null;
  }

  try {
    const client = createSupabaseServerClient(authToken);
    if (!client) return null;

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(authToken);

    if (authError || !user) {
      return null;
    }

    // Retrieve corresponding profile
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback to user metadata if profile table row not yet inserted
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        studentId: user.user_metadata?.student_id || undefined,
        role: user.user_metadata?.role || 'student',
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      studentId: profile.student_id,
      role: profile.role,
    };
  } catch (err) {
    console.error('Error fetching authenticated user from Supabase:', err);
    return null;
  }
}
