'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { logoutUser } from '@/app/actions';
import {
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
  FileText,
  Menu,
  X,
  Settings,
  User,
} from 'lucide-react';

export default function Sidebar({ role, schoolName, userName, userInitials }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    // Close drawer on route change
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add('menu-open');

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen, closeMenu]);

  function isActive(href) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClass(href) {
    return `sidebar-link${isActive(href) ? ' active' : ''}`;
  }

  const roleLabel = {
    super_admin: 'Super admin',
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  }[role] || role;

  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={false}
          aria-controls="dashboard-sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={closeMenu}
        aria-hidden={!mobileOpen}
      />

      <aside
        id="dashboard-sidebar"
        className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}
        aria-hidden={false}
      >
        <div className="sidebar-header flex items-start justify-between">
          <div className="w-full overflow-hidden pr-xs">
            <div className="nav-logo text-truncate" title={schoolName}>
              <Image
                src="/imperial-edu-logo.svg"
                alt=""
                width={32}
                height={32}
                className="shrink-0"
              />
              <span className="text-sm font-bold text-truncate">{schoolName}</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-menu" aria-label="Main">
          <Link href="/dashboard" className={linkClass('/dashboard')} onClick={closeMenu}>
            <LayoutDashboard size={17} strokeWidth={1.75} />
            Overview
          </Link>

          {role === 'super_admin' && (
            <>
              <div className="sidebar-section-label">Platform</div>
              <Link href="/dashboard/super-admin" className={linkClass('/dashboard/super-admin')} onClick={closeMenu}>
                <Layers size={17} strokeWidth={1.75} />
                Control plane
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <div className="sidebar-section-label">School</div>
              <Link href="/dashboard/admin/users" className={linkClass('/dashboard/admin/users')} onClick={closeMenu}>
                <Users size={17} strokeWidth={1.75} />
                Users
              </Link>
              <Link href="/dashboard/admin/classes" className={linkClass('/dashboard/admin/classes')} onClick={closeMenu}>
                <BookOpen size={17} strokeWidth={1.75} />
                Classes &amp; subjects
              </Link>
              <Link href="/dashboard/admin/timetable" className={linkClass('/dashboard/admin/timetable')} onClick={closeMenu}>
                <Clock size={17} strokeWidth={1.75} />
                Timetable
              </Link>

              <div className="sidebar-section-label">Academics</div>
              <Link href="/dashboard/admin/cbt" className={linkClass('/dashboard/admin/cbt')} onClick={closeMenu}>
                <Award size={17} strokeWidth={1.75} />
                CBT audits
              </Link>
              <Link href="/dashboard/admin/broadsheet" className={linkClass('/dashboard/admin/broadsheet')} onClick={closeMenu}>
                <FileSpreadsheet size={17} strokeWidth={1.75} />
                Broadsheet
              </Link>
              <Link href="/dashboard/admin/announcements" className={linkClass('/dashboard/admin/announcements')} onClick={closeMenu}>
                <Megaphone size={17} strokeWidth={1.75} />
                Announcements
              </Link>

              <div className="sidebar-section-label">Finance</div>
              <Link href="/dashboard/admin/fees" className={linkClass('/dashboard/admin/fees')} onClick={closeMenu}>
                <CreditCard size={17} strokeWidth={1.75} />
                Student fees
              </Link>
              <Link href="/dashboard/admin/billing" className={linkClass('/dashboard/admin/billing')} onClick={closeMenu}>
                <CreditCard size={17} strokeWidth={1.75} />
                Billing
              </Link>
            </>
          )}

          {role === 'teacher' && (
            <>
              <div className="sidebar-section-label">Classroom</div>
              <Link href="/dashboard/teacher/attendance" className={linkClass('/dashboard/teacher/attendance')} onClick={closeMenu}>
                <Calendar size={17} strokeWidth={1.75} />
                Attendance
              </Link>
              <Link href="/dashboard/teacher/assignments" className={linkClass('/dashboard/teacher/assignments')} onClick={closeMenu}>
                <CheckSquare size={17} strokeWidth={1.75} />
                Assignments
              </Link>
              <Link href="/dashboard/teacher/notes" className={linkClass('/dashboard/teacher/notes')} onClick={closeMenu}>
                <FileText size={17} strokeWidth={1.75} />
                Class Notes
              </Link>
              <Link href="/dashboard/teacher/grades" className={linkClass('/dashboard/teacher/grades')} onClick={closeMenu}>
                <FileSpreadsheet size={17} strokeWidth={1.75} />
                Grades
              </Link>
              <Link href="/dashboard/teacher/cbt" className={linkClass('/dashboard/teacher/cbt')} onClick={closeMenu}>
                <Award size={17} strokeWidth={1.75} />
                CBT exams
              </Link>
              <Link href="/dashboard/teacher/timetable" className={linkClass('/dashboard/teacher/timetable')} onClick={closeMenu}>
                <Clock size={17} strokeWidth={1.75} />
                Timetable
              </Link>
            </>
          )}

          {role === 'parent' && (
            <>
              <div className="sidebar-section-label">Family</div>
              <Link href="/dashboard/parent" className={linkClass('/dashboard/parent')} onClick={closeMenu}>
                <FileSpreadsheet size={17} strokeWidth={1.75} />
                Child portal
              </Link>
            </>
          )}

          {role === 'student' && (
            <>
              <div className="sidebar-section-label">My work</div>
              <Link href="/dashboard/student/grades" className={linkClass('/dashboard/student/grades')} onClick={closeMenu}>
                <FileSpreadsheet size={17} strokeWidth={1.75} />
                Report card
              </Link>
              <Link href="/dashboard/student/assignments" className={linkClass('/dashboard/student/assignments')} onClick={closeMenu}>
                <CheckSquare size={17} strokeWidth={1.75} />
                Assignments
              </Link>
              <Link href="/dashboard/student/notes" className={linkClass('/dashboard/student/notes')} onClick={closeMenu}>
                <FileText size={17} strokeWidth={1.75} />
                Class Notes
              </Link>
              <Link href="/dashboard/student/cbt" className={linkClass('/dashboard/student/cbt')} onClick={closeMenu}>
                <Award size={17} strokeWidth={1.75} />
                CBT exams
              </Link>
              <Link href="/dashboard/student/timetable" className={linkClass('/dashboard/student/timetable')} onClick={closeMenu}>
                <Clock size={17} strokeWidth={1.75} />
                Timetable
              </Link>
              <Link href="/dashboard/student/attendance" className={linkClass('/dashboard/student/attendance')} onClick={closeMenu}>
                <Calendar size={17} strokeWidth={1.75} />
                Attendance
              </Link>
              <Link href="/dashboard/student/fees" className={linkClass('/dashboard/student/fees')} onClick={closeMenu}>
                <CreditCard size={17} strokeWidth={1.75} />
                Fees
              </Link>
            </>
          )}

          <div className="sidebar-section-label">Account</div>
          {(role === 'student' || role === 'teacher') && (
            <Link href={`/dashboard/${role}/profile`} className={linkClass(`/dashboard/${role}/profile`)} onClick={closeMenu}>
              <User size={17} strokeWidth={1.75} />
              My Profile
            </Link>
          )}
          <Link href="/dashboard/settings" className={linkClass('/dashboard/settings')} onClick={closeMenu}>
            <Settings size={17} strokeWidth={1.75} />
            Settings
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">
              {userInitials}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-sm font-bold text-foreground text-truncate leading-tight">
                {userName}
              </div>
              <div className="text-xs text-muted">
                {roleLabel}
              </div>
            </div>
          </div>

          <form action={logoutUser}>
            <button type="submit" className="btn btn-ghost w-full justify-start gap-sm">
              <LogOut size={16} strokeWidth={1.75} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
