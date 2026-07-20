import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import {
  Calendar,
  Award,
  BookOpen,
  Clock,
  Megaphone,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: grades } = await supabase
    .from('grades')
    .select('grade_value')
    .eq('student_id', user.id);

  let averageGrade = '—';
  if (grades && grades.length > 0) {
    const sum = grades.reduce((acc, curr) => acc + parseFloat(curr.grade_value), 0);
    averageGrade = `${(sum / grades.length).toFixed(1)}%`;
  }

  const { data: attendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', user.id);

  let attendanceRate = '—';
  if (attendance && attendance.length > 0) {
    const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    attendanceRate = `${((presentCount / attendance.length) * 100).toFixed(0)}%`;
  }

  const { data: enrollmentsList } = await supabase
    .from('enrollments')
    .select('academic_year_id, classes(name, academic_years(name))')
    .eq('student_id', user.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('schools(active_academic_year_id)')
    .eq('id', user.id)
    .single();

  const activeYearId = profile?.schools?.active_academic_year_id;
  const enrollment = enrollmentsList?.find((e) => e.academic_year_id === activeYearId) || enrollmentsList?.[0];

  const className = enrollment?.classes?.name || 'Not enrolled';
  const termName = enrollment?.classes?.academic_years?.name || 'No active session';

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  const stats = [
    {
      title: 'Average',
      value: averageGrade,
      link: '/dashboard/student/grades',
      linkLabel: 'View report card',
      icon: Award,
      color: 'stat-icon-violet',
    },
    {
      title: 'Attendance',
      value: attendanceRate,
      link: '/dashboard/student/attendance',
      linkLabel: 'View attendance',
      icon: Calendar,
      color: 'stat-icon-emerald',
    },
    {
      title: 'Classroom',
      value: className,
      subtext: termName,
      icon: BookOpen,
      color: 'stat-icon-indigo',
    },
  ];

  return (
    <div className="animate-fade-in pb-5xl">
      <div className="page-header">
        <h1>Student workspace</h1>
        <p>Track grades, complete assignments, and stay on top of your timetable.</p>
      </div>

      <div className="dashboard-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="card card-hover stat-card animate-slide-up"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="stat-card-top">
                <span className="stat-card-label">{stat.title}</span>
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={17} strokeWidth={1.75} />
                </div>
              </div>
              <div className="stat-card-value">{stat.value}</div>
              {stat.link ? (
                <Link href={stat.link} className="stat-card-link">
                  {stat.linkLabel} <ArrowRight size={12} strokeWidth={2} />
                </Link>
              ) : (
                <span className="stat-card-desc">{stat.subtext}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="responsive-grid-2-1">
        <div className="card">
          <h3 className="text-lg font-bold mb-lg flex items-center gap-sm">
            <div className="stat-icon stat-icon-amber">
              <Megaphone size={16} strokeWidth={1.75} />
            </div>
            School announcements
          </h3>

          <div className="board-list">
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="board-item">
                  <div className="board-item-header">
                    <h4 className="board-item-title">{ann.title}</h4>
                    <span className="board-item-date">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="board-item-body">{ann.content}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={18} strokeWidth={1.75} />
                </div>
                <p>No announcements yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-lg">
          <div className="card">
            <h3 className="text-lg font-bold mb-lg">Quick links</h3>
            <div className="quick-nav">
              <Link href="/dashboard/student/assignments" className="quick-nav-link">
                <span className="quick-nav-link-inner">
                  <CheckSquare size={14} strokeWidth={1.75} />
                  Assignments
                </span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/student/timetable" className="quick-nav-link">
                <span className="quick-nav-link-inner">
                  <Clock size={14} strokeWidth={1.75} />
                  Timetable
                </span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/student/cbt" className="quick-nav-link">
                <span className="quick-nav-link-inner">
                  <Award size={14} strokeWidth={1.75} />
                  CBT exams
                </span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
            </div>
          </div>

          <div className="card">
            <span className="text-sm font-bold text-foreground mb-sm" style={{ display: 'block' }}>
              Privacy notice
            </span>
            <p className="text-xs text-muted leading-relaxed">
              Your account only shows information linked to your student profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
