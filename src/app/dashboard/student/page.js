import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Calendar, Award, BookOpen, Clock, Megaphone, ArrowRight, FileSpreadsheet, CheckSquare } from 'lucide-react';

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch student average grade
  const { data: grades } = await supabase
    .from('grades')
    .select('grade_value')
    .eq('student_id', user.id);

  let averageGrade = 'N/A';
  if (grades && grades.length > 0) {
    const sum = grades.reduce((acc, curr) => acc + parseFloat(curr.grade_value), 0);
    averageGrade = (sum / grades.length).toFixed(2) + '%';
  }

  // 2. Fetch student attendance records
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', user.id);

  let attendanceRate = 'N/A';
  if (attendance && attendance.length > 0) {
    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    attendanceRate = ((presentCount / attendance.length) * 100).toFixed(0) + '%';
  }

  // 3. Fetch student enrollment class name
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classes(name, academic_years(name))')
    .eq('student_id', user.id)
    .single();

  const className = enrollment?.classes?.name || 'Not Enrolled';
  const termName = enrollment?.classes?.academic_years?.name || 'Unassigned Session';

  // 4. Fetch latest announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  const stats = [
    {
      title: 'Academic Average',
      value: averageGrade,
      link: '/dashboard/student/grades',
      linkLabel: 'View Report Card',
      icon: Award,
      color: 'stat-icon-violet',
    },
    {
      title: 'Attendance Rate',
      value: attendanceRate,
      link: '/dashboard/student/attendance',
      linkLabel: 'View Attendance Log',
      icon: Calendar,
      color: 'stat-icon-emerald',
    },
    {
      title: 'Current Classroom',
      value: className,
      subtext: termName,
      icon: BookOpen,
      color: 'stat-icon-indigo',
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>Student Workspace</h1>
        <p>Welcome back! Monitor your class timetable, complete assignments, and track term grades.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card card-hover animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.title}
                </span>
                <div className={`stat-icon ${stat.color}`} style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                  <Icon size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--foreground))', marginBottom: '0.5rem', lineHeight: 1.1 }}>
                {stat.value}
              </h3>
              {stat.link ? (
                <Link href={stat.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 650 }}>
                  {stat.linkLabel} <ArrowRight size={12} />
                </Link>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 550 }}>
                  {stat.subtext}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Board Grid */}
      <div className="responsive-grid-2-1">
        {/* School Announcements */}
        <div className="card animate-slide-up">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stat-icon stat-icon-amber" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
              <Megaphone size={16} />
            </div>
            School Billboard
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} style={{ borderBottom: '1px solid hsl(var(--border)/0.5)', paddingBottom: '1rem', last: { borderBottom: 'none' } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <h4 style={{ fontWeight: 650, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>{ann.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                    {ann.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={20} />
                </div>
                <p style={{ fontSize: '0.85rem' }}>No announcements broadcasted yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'hsl(var(--foreground))' }}>
              Quick Navigation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link 
                href="/dashboard/student/assignments" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={14} /> My Assignments Desk
                </span>
                <ArrowRight size={14} />
              </Link>
              
              <Link 
                href="/dashboard/student/timetable" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} /> My Timetable
                </span>
                <ArrowRight size={14} />
              </Link>

              <Link 
                href="/dashboard/student/cbt" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={14} /> CBT Exam Lobby
                </span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: 'hsl(var(--foreground))' }}>Security Protocol</span>
            Your credentials grant you read-only access strictly to information corresponding to your individual student account.
          </div>
        </div>
      </div>
    </div>
  );
}
