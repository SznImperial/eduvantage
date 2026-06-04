import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Calendar, Award, BookOpen, Clock, Megaphone, ArrowRight } from 'lucide-react';

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
  const termName = enrollment?.classes?.academic_years?.name || '';

  // 4. Fetch latest announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Student Hub</h1>
        <p>Welcome back! View your current grades, track your attendance rates, and check school notices.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="dashboard-grid">
        {/* Academic Average */}
        <div className="card card-hover animate-slide-up stagger-1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Academic Average</span>
            <div className="stat-icon stat-icon-violet">
              <Award size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.625rem', lineHeight: 1 }}>{averageGrade}</div>
          <Link href="/dashboard/student/grades" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(var(--accent-violet-text))', fontWeight: 550 }}>
            View Full Report Card <ArrowRight size={14} />
          </Link>
        </div>

        {/* Attendance Rate */}
        <div className="card card-hover animate-slide-up stagger-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance Rate</span>
            <div className="stat-icon stat-icon-emerald">
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.625rem', lineHeight: 1 }}>{attendanceRate}</div>
          <Link href="/dashboard/student/attendance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(var(--accent-emerald-text))', fontWeight: 550 }}>
            View Attendance Log <ArrowRight size={14} />
          </Link>
        </div>

        {/* Current Classroom */}
        <div className="card card-hover animate-slide-up stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Classroom</span>
            <div className="stat-icon stat-icon-indigo">
              <BookOpen size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem', lineHeight: 1.2 }}>{className}</div>
          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
            {termName}
          </span>
        </div>
      </div>

      {/* Main Board Grid */}
      <div className="responsive-grid-2-1">

        {/* School Announcements */}
        <div className="card animate-slide-up stagger-4">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stat-icon stat-icon-amber" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
              <Megaphone size={18} />
            </div>
            School Announcements
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="announcement-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{ann.title}</h4>
                    <span className="badge badge-secondary" style={{ fontSize: '0.6875rem', fontWeight: 500 }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                    {ann.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={24} />
                </div>
                <p>No active announcements on the billboard.</p>
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="card animate-slide-up stagger-4" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Quick Guide</h3>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            To view full breakdowns of your performance, click on the sidebar navigation links.
          </p>
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: 'hsl(var(--foreground))' }}>Security Protocol</span>
            Your credentials grant you read-only access strictly to information corresponding to your individual student account.
          </div>
        </div>
      </div>
    </div>
  );
}
