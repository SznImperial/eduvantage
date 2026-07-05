import { createClient } from '@supabase/supabase-js';

async function check() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sgkyxsdqcpxakeiuarwb.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88';
  const adminClient = createClient(supabaseUrl, supabaseKey);

  const { data: profiles } = await adminClient.from('profiles').select('*').eq('role', 'teacher');
  console.log('Teachers:', profiles);

  const { data: cs } = await adminClient.from('class_subjects').select('*');
  console.log('Class Subjects:', cs);
}

check().catch(console.error);
