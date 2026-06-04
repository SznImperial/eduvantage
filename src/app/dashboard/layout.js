import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { logoutUser } from '@/app/actions';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  FileSpreadsheet, 
  Megaphone, 
  LogOut 
} from 'lucide-react';

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

  const schoolName = profile.schools?.name || 'EduVantage';
  const role = profile.role;
  const userName = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="nav-logo" style={{ fontSize: '1.15rem' }}>
            <GraduationCap size={24} />
            Edu<span>Vantage</span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: '0.5rem',
            padding: '0.15rem 0.625rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            backgroundColor: 'hsl(var(--accent-indigo))',
            color: 'hsl(var(--accent-indigo-text))',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {schoolName}
          </div>
        </div>

        <nav className="sidebar-menu">
          <Link href="/dashboard" className="sidebar-link">
            <LayoutDashboard size={18} />
            Dashboard Home
          </Link>

          {role === 'admin' && (
            <>
              <Link href="/dashboard/admin/users" className="sidebar-link">
                <Users size={18} />
                User Accounts
              </Link>
              <Link href="/dashboard/admin/classes" className="sidebar-link">
                <BookOpen size={18} />
                Classes & Subjects
              </Link>
              <Link href="/dashboard/admin/announcements" className="sidebar-link">
                <Megaphone size={18} />
                Announcements
              </Link>
            </>
          )}

          {role === 'teacher' && (
            <>
              <Link href="/dashboard/teacher/attendance" className="sidebar-link">
                <Calendar size={18} />
                Daily Attendance
              </Link>
              <Link href="/dashboard/teacher/grades" className="sidebar-link">
                <FileSpreadsheet size={18} />
                Academic Grades
              </Link>
            </>
          )}

          {role === 'student' && (
            <>
              <Link href="/dashboard/student/grades" className="sidebar-link">
                <FileSpreadsheet size={18} />
                My Report Card
              </Link>
              <Link href="/dashboard/student/attendance" className="sidebar-link">
                <Calendar size={18} />
                My Attendance
              </Link>
            </>
          )}
        </nav>

        {/* User profile section */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid hsl(var(--border) / 0.6)',
          paddingTop: '1.25rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '0 0.375rem'
          }}>
            {/* Gradient ring avatar */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--avatar-gradient)',
              padding: '2px',
              flexShrink: 0
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--sidebar-bg))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'hsl(var(--primary))',
                letterSpacing: '-0.02em'
              }}>
                {profile.first_name[0] || ''}{profile.last_name[0] || ''}
              </div>
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'hsl(var(--foreground))',
                lineHeight: 1.3
              }}>
                {userName}
              </div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: 'hsl(var(--muted-foreground))',
                textTransform: 'capitalize',
                letterSpacing: '0.02em'
              }}>
                {role}
              </div>
            </div>
          </div>

          <form action={logoutUser}>
            <button
              className="btn btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                gap: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.825rem'
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header — breadcrumb style */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 2rem',
          borderBottom: '1px solid hsl(var(--border) / 0.5)',
          backgroundColor: 'hsl(var(--card) / 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.8125rem',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: 500
            }}>
              EduVantage
            </span>
            <span style={{
              fontSize: '0.8125rem',
              color: 'hsl(var(--muted-foreground) / 0.4)',
              fontWeight: 400
            }}>
              /
            </span>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 650,
              color: 'hsl(var(--foreground))',
              textTransform: 'capitalize'
            }}>
              {role === 'admin' ? 'Administration' : role + ' Dashboard'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
