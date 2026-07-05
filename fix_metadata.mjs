import { createClient } from '@supabase/supabase-js';

async function fixMetadata() {
  const supabaseUrl = 'https://sgkyxsdqcpxakeiuarwb.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88';
  const adminClient = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching profiles...');
  const { data: profiles, error } = await adminClient.from('profiles').select('*');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  for (const profile of profiles) {
    console.log(`Updating metadata for user ${profile.id} (${profile.email})...`);
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      profile.id,
      {
        user_metadata: {
          role: profile.role,
          school_id: profile.school_id
        }
      }
    );
    if (updateError) {
      console.error(`Failed to update ${profile.id}:`, updateError.message);
    } else {
      console.log(`Success for ${profile.id}`);
    }
  }
  
  console.log('Done.');
}

fixMetadata().catch(console.error);
