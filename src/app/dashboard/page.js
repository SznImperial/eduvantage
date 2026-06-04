import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect('/login');
  }

  // Fetch the user's profile and school details using relational query
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    // If user exists in Auth but has no public profile, sign out and redirect
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Redirect based on role
  if (profile.role === 'admin') {
    redirect('/dashboard/admin');
  } else if (profile.role === 'teacher') {
    redirect('/dashboard/teacher');
  } else if (profile.role === 'student' || profile.role === 'parent') {
    redirect('/dashboard/student');
  } else {
    redirect('/login');
  }
}
