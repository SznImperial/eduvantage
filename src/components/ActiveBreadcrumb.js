'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const SEGMENT_LABELS = {
  admin: 'Administration',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  'super-admin': 'Platform',
  users: 'Users',
  classes: 'Classes',
  timetable: 'Timetable',
  fees: 'Fees',
  cbt: 'CBT',
  broadsheet: 'Broadsheet',
  announcements: 'Announcements',
  billing: 'Billing',
  attendance: 'Attendance',
  assignments: 'Assignments',
  grades: 'Grades',
  take: 'Take exam',
  settings: 'Settings',
};

export default function ActiveBreadcrumb() {
  const pathname = usePathname();
  const allSegments = pathname.split('/').filter(Boolean);
  const segments = allSegments.slice(1);

  const crumbs = segments.map((seg, i) => {
    const href = '/' + allSegments.slice(0, i + 2).join('/');
    const label = SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {crumbs.length === 0 ? (
        <span className="breadcrumb-root">Overview</span>
      ) : (
        <>
          <Link href="/dashboard" className="breadcrumb-link">
            Overview
          </Link>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={crumb.href} className="flex items-center gap-sm">
                <span className="breadcrumb-sep" aria-hidden="true">/</span>
                {isLast ? (
                  <span className="breadcrumb-current">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </>
      )}
    </nav>
  );
}
