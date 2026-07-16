import { createServerClient } from '@supabase/ssr';

export let currentCookies = [];

export function setMockCookies(cookiesArray) {
  currentCookies = cookiesArray;
}

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return currentCookies;
        },
        setAll(cookiesToSet) {
          // No-op in test environment
        },
      },
    }
  );
}
