import { createClient } from '@supabase/supabase-js';

async function checkMetadata() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sgkyxsdqcpxakeiuarwb.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(supabaseUrl, supabaseKey);

  const { data: users, error } = await adminClient.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const teacher = users.users.find(u => u.email === 'teachertest@john.edu.ng');
  console.log('Teacher Auth User:', JSON.stringify(teacher, null, 2));

  // Check if class_subjects is reachable via service role just in case
  const { data: cs } = await adminClient
        .from('class_subjects')
        .select('*, classes(name), subjects(name, code)')
        .eq('teacher_id', teacher.id);
  console.log('CS List:', JSON.stringify(cs, null, 2));

}

checkMetadata().catch(console.error);
