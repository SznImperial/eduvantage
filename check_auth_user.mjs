import { createClient } from '@supabase/supabase-js';

async function check() {
  const supabaseUrl = 'https://sgkyxsdqcpxakeiuarwb.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88';
  const adminClient = createClient(supabaseUrl, supabaseKey);

  const { data: users, error } = await adminClient.auth.admin.listUsers();
  
  if (error) {
    console.error(error);
    return;
  }
  
  const teacher = users.users.find(u => u.email === 'teachertest@john.edu.ng');
  console.log('Teacher Auth User:', JSON.stringify(teacher, null, 2));
}

check().catch(console.error);
