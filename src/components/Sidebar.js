'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  X,
  Settings
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
        <div className="sidebar-header flex items-start justify-between">
          <div className="w-full overflow-hidden pr-xs">
            <div className="nav-logo text-lg text-truncate flex items-center gap-2" title={schoolName}>
              <Image src="/imperial-edu-logo.svg" alt="IMP3RIAL EDU Logo" width={48} height={48} className="shrink-0" />
              <span className="font-extrabold">{schoolName}</span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            className="mobile-menu-btn mt-xs"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
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

          <Link href="/dashboard/settings" className={linkClass('/dashboard/settings')} onClick={handleNavClick}>
            <Settings size={18} />
            Account Settings
          </Link>
        </nav>

        {/* User profile section */}
        <div className="mt-auto pt-lg border-b">
          <div className="flex items-center gap-sm mb-md px-xs">
            {/* Gradient ring avatar */}
            <div className="auth-card-icon rounded-full shrink-0 p-0.5 w-10 h-10 mb-0">
              <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-card text-primary rounded-full tracking-tight">
                {userInitials}
              </div>
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-sm font-bold text-foreground text-truncate leading-tight">
                {userName}
              </div>
              <div className="text-xs font-medium text-muted capitalize tracking-wide">
                {role}
              </div>
            </div>
          </div>

          <form action={logoutUser}>
            <button className="btn btn-ghost w-full justify-start gap-sm">
              <LogOut size={18} />
              Sign Out
            </button>
          </form>
          <div className="text-center text-xs text-muted mt-lg opacity-70 tracking-wide">
            Powered by IMP3RIAL EDU
          </div>
        </div>
      </aside>
    </>
  );
}
