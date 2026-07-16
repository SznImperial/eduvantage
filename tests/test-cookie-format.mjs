import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // 1. Authenticate a user to get a session
  const client = createSupabaseClient(url, anonKey);
  const { data: authData, error } = await client.auth.signInWithPassword({
    email: 'teachertest@john.edu.ng',
    password: 'password123'
  });
  
  if (error) {
    console.error('Sign in error:', error);
    return;
  }
  
  const { session } = authData;
  console.log('Got session token!');
  
  // 2. Prepare cookie
  const ref = url.match(/https:\/\/([^.]+)\.supabase/)[1];
  const cookieName = `sb-${ref}-auth-token`;
  
  // Standard format for @supabase/ssr is JSON.stringify(session)
  const cookieValue = JSON.stringify(session);
  
  console.log(`Testing cookie: ${cookieName}`);
  
  // 3. Create server client with mocked cookies
  const serverClient = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return [{ name: cookieName, value: cookieValue }];
      },
      setAll() {}
    }
  });
  
  // 4. Verify user can be fetched via server client
  const { data: { user }, error: userError } = await serverClient.auth.getUser();
  if (userError) {
    console.error('GetUser error:', userError);
  } else {
    console.log('Successfully authenticated via cookie! User email:', user.email);
  }
}

test().catch(console.error);
