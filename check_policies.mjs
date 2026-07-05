import { createClient } from '@supabase/supabase-js';

async function check() {
  const supabaseUrl = 'https://sgkyxsdqcpxakeiuarwb.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88';
  const adminClient = createClient(supabaseUrl, supabaseKey);

  const { data: policies, error } = await adminClient.rpc('get_policies', {});
  console.log('Error:', error);
  console.log('Policies:', policies);
  
  // if rpc doesn't exist, we can use raw query via rest api? We can't do raw sql via supabase-js without a function.
}

check().catch(console.error);
