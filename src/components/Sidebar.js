'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logoutUser } from '@/app/actions';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Megaphone,
  LogOut,
  CreditCard,
  Layers,
  Clock,
  Award,
  CheckSquare,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ role, schoolName, userName, userInitials }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href) {
    return pathname === href || (pathname.startsWith(href) && href !== '/dashboard');
  }

  function linkClass(href) {
    return `sidebar-link${isActive(href) ? ' active' : ''}`;
  }

  function handleNavClick() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay backdrop */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
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

          {/* Close button for mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            style={{ marginTop: '0.25rem' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <Link href="/dashboard" className={linkClass('/dashboard')} onClick={handleNavClick}>
            <LayoutDashboard size={18} />
            Dashboard Home
          </Link>

          {role === 'super_admin' && (
            <>
              <Link href="/dashboard/super-admin" className={linkClass('/dashboard/super-admin')} onClick={handleNavClick}>
                <Layers size={18} />
                SaaS Control Plane
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link href="/dashboard/admin/users" className={linkClass('/dashboard/admin/users')} onClick={handleNavClick}>
                <Users size={18} />
                User Accounts
              </Link>
              <Link href="/dashboard/admin/classes" className={linkClass('/dashboard/admin/classes')} onClick={handleNavClick}>
                <BookOpen size={18} />
                Classes &amp; Subjects
              </Link>
              <Link href="/dashboard/admin/timetable" className={linkClass('/dashboard/admin/timetable')} onClick={handleNavClick}>
                <Clock size={18} />
                Timetable Builder
              </Link>
              <Link href="/dashboard/admin/fees" className={linkClass('/dashboard/admin/fees')} onClick={handleNavClick}>
                <CreditCard size={18} />
                Student Fees
              </Link>
              <Link href="/dashboard/admin/cbt" className={linkClass('/dashboard/admin/cbt')} onClick={handleNavClick}>
                <Award size={18} />
                CBT Audits
              </Link>
              <Link href="/dashboard/admin/broadsheet" className={linkClass('/dashboard/admin/broadsheet')} onClick={handleNavClick}>
                <FileSpreadsheet size={18} />
                Academic Broadsheet
              </Link>
              <Link href="/dashboard/admin/announcements" className={linkClass('/dashboard/admin/announcements')} onClick={handleNavClick}>
                <Megaphone size={18} />
                Announcements
              </Link>
              <Link href="/dashboard/admin/billing" className={linkClass('/dashboard/admin/billing')} onClick={handleNavClick}>
                <CreditCard size={18} />
                Billing &amp; Limits
              </Link>
            </>
          )}

          {role === 'teacher' && (
            <>
              <Link href="/dashboard/teacher/attendance" className={linkClass('/dashboard/teacher/attendance')} onClick={handleNavClick}>
                <Calendar size={18} />
                Daily Attendance
              </Link>
              <Link href="/dashboard/teacher/assignments" className={linkClass('/dashboard/teacher/assignments')} onClick={handleNavClick}>
                <CheckSquare size={18} />
                Assignments Desk
              </Link>
              <Link href="/dashboard/teacher/grades" className={linkClass('/dashboard/teacher/grades')} onClick={handleNavClick}>
                <FileSpreadsheet size={18} />
                Academic Grades
              </Link>
              <Link href="/dashboard/teacher/cbt" className={linkClass('/dashboard/teacher/cbt')} onClick={handleNavClick}>
                <Award size={18} />
                CBT Exams
              </Link>
              <Link href="/dashboard/teacher/timetable" className={linkClass('/dashboard/teacher/timetable')} onClick={handleNavClick}>
                <Clock size={18} />
                My Timetable
              </Link>
            </>
          )}

          {role === 'parent' && (
            <>
              <Link href="/dashboard/parent" className={linkClass('/dashboard/parent')} onClick={handleNavClick}>
                <FileSpreadsheet size={18} />
                Child Portal
              </Link>
            </>
          )}

          {role === 'student' && (
            <>
              <Link href="/dashboard/student/grades" className={linkClass('/dashboard/student/grades')} onClick={handleNavClick}>
                <FileSpreadsheet size={18} />
                My Report Card
              </Link>
              <Link href="/dashboard/student/assignments" className={linkClass('/dashboard/student/assignments')} onClick={handleNavClick}>
                <CheckSquare size={18} />
                My Assignments
              </Link>
              <Link href="/dashboard/student/cbt" className={linkClass('/dashboard/student/cbt')} onClick={handleNavClick}>
                <Award size={18} />
                CBT Lobby
              </Link>
              <Link href="/dashboard/student/timetable" className={linkClass('/dashboard/student/timetable')} onClick={handleNavClick}>
                <Clock size={18} />
                My Timetable
              </Link>
              <Link href="/dashboard/student/attendance" className={linkClass('/dashboard/student/attendance')} onClick={handleNavClick}>
                <Calendar size={18} />
                My Attendance
              </Link>
              <Link href="/dashboard/student/fees" className={linkClass('/dashboard/student/fees')} onClick={handleNavClick}>
                <CreditCard size={18} />
                My Fees
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
                {userInitials}
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
                fontSize: '0.875rem', /* better readability */
                padding: '0.75rem 0.5rem' /* larger touch target */
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
