import { createClient } from '@supabase/supabase-js';

async function test() {
  const supabaseUrl = 'https://sgkyxsdqcpxakeiuarwb.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjY0NDAsImV4cCI6MjA5NjAwMjQ0MH0.FDjyld1WUuiV0pNE7vGJWOTGhG394A_Plg-lEwBMer4';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'teachertest@john.edu.ng',
    password: 'password123'
  });

  if (authErr) {
    console.error('Auth Error:', authErr.message);
    return;
  }
  
  const user = authData.user;
  console.log('Logged in as:', user.email);

  const { data: csList, error: csErr } = await supabase
    .from('class_subjects')
    .select('*, classes(name), subjects(name, code)')
    .eq('teacher_id', user.id);

  console.log('CS Error:', csErr);
  console.log('CS List:', csList);
  
  // also try simple select
  const { data: simpleCsList } = await supabase.from('class_subjects').select('*').eq('teacher_id', user.id);
  console.log('Simple CS List:', simpleCsList);
  
  // check profiles
  const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id);
  console.log('My Profile:', myProfile);
}

test().catch(console.error);
