import { createClient } from '@supabase/supabase-js';

// Supabase Connection Credentials
const rawUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://nirptvwydntzsqyvpsoa.supabase.co/rest/v1/';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const SUPABASE_ANON_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcnB0dnd5ZG50enNxeXZwc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTMyMjcsImV4cCI6MjEwNzEyOTIyN30.UWWn5r0K26POXO7_FzfHDI_PDT79OfoPXDiz_JMFM9M';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_6v4rLranxaVxbFUbVODKOg_NfoG0jsf';

export const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env?.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcnB0dnd5ZG50enNxeXZwc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTU1MzIyNywiZXhwIjoyMTA3MTI5MjI3fQ.JwV06qXzaBafpSEU6ccCy7aMYYrZ2ixoYqkwGhOujcc';

export const SUPABASE_SECRET_KEY =
  import.meta.env?.SUPABASE_SECRET_KEY ||
  'sb_secret_K6l7ulout5nloA3JhCTclg_4_QN4CxX';

// 1. Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * 2. Google OAuth Login Function
 * Initiates the Google OAuth flow via Supabase
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('[Supabase OAuth] Error signing in with Google:', error.message);
    throw error;
  }

  return data;
}

/**
 * 3. Sign Out Function
 */
export async function signOutFromSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('[Supabase OAuth] Error signing out:', error.message);
  }
}

/**
 * 4. Auth State Change Listener
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => {
    subscription?.unsubscribe();
  };
}

export default supabase;
