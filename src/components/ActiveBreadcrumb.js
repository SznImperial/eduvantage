'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const SEGMENT_LABELS = {
  'admin': 'Administration',
  'teacher': 'Teacher Portal',
  'student': 'Student Hub',
  'parent': 'Parent View',
  'super-admin': 'SaaS Control',
  'users': 'User Accounts',
  'classes': 'Classes & Subjects',
  'timetable': 'Timetable',
  'fees': 'Tuition Fees',
  'cbt': 'CBT Exams',
  'broadsheet': 'Broadsheet',
  'announcements': 'Announcements',
  'billing': 'Billing & Limits',
  'attendance': 'Attendance',
  'assignments': 'Assignments',
  'grades': 'Grades',
  'take': 'Take Exam',
};

export default function ActiveBreadcrumb() {
  const pathname = usePathname();

  // Split pathname and remove empty segments + "dashboard" root
  const allSegments = pathname.split('/').filter(Boolean);
  // e.g. ['dashboard', 'admin', 'classes']
  // Remove 'dashboard' since we always start with "IMP3RIAL EDU"
  const segments = allSegments.slice(1);

  // Build breadcrumb items
  const crumbs = segments.map((seg, i) => {
    const href = '/' + allSegments.slice(0, i + 2).join('/');
    const label = SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {/* Root crumb */}
      {crumbs.length === 0 ? (
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 650,
          color: 'hsl(var(--foreground))'
        }}>
          IMP3RIAL EDU
        </span>
      ) : (
        <>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.8125rem',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: 500
            }}
          >
            IMP3RIAL EDU
          </Link>

          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.8125rem',
                  color: 'hsl(var(--muted-foreground) / 0.4)',
                  fontWeight: 400
                }}>
                  /
                </span>
                {isLast ? (
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 650,
                    color: 'hsl(var(--foreground))'
                  }}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    style={{
                      fontSize: '0.8125rem',
                      color: 'hsl(var(--muted-foreground))',
                      fontWeight: 500
                    }}
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </>
      )}
    </div>
  );
}
