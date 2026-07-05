import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import ActiveBreadcrumb from '@/components/ActiveBreadcrumb';
import ActiveSessionBanner from '@/components/ActiveSessionBanner';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect('/login');
  }

  // Fetch the user's profile and school name
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, schools(name)')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    redirect('/login');
  }

  const role = profile.role;
  const schoolName = role === 'super_admin' ? 'Global SaaS Admin' : (profile.schools?.name || 'EduVantage');
  const userName = `${profile.first_name} ${profile.last_name}`;
  const userInitials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`;

  return (
    <div className="dashboard-layout">
      {/* Client-side Sidebar with active link highlighting + mobile support */}
      <Sidebar
        role={role}
        schoolName={schoolName}
        userName={userName}
        userInitials={userInitials}
      />

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header — dynamic breadcrumb + session context */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <ActiveBreadcrumb />
            <ActiveSessionBanner role={role} />
          </div>
          <div className="dashboard-header-right">
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Portal View */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
