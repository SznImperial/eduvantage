import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Calendar, FileSpreadsheet, BookOpen, Clock, Megaphone, ArrowRight, UserCheck, Award } from 'lucide-react';

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch classes assigned to this teacher
  const { data: courses } = await supabase
    .from('class_subjects')
    .select('id, classes(id, name), subjects(name, code)')
    .eq('teacher_id', user.id);

  // Fetch latest 3 announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>Teacher Workspace</h1>
        <p>Record daily student attendance, manage terminal course grades, and audit exam results.</p>
      </div>

      {/* Quick Action Cards */}
      <div className="responsive-grid-1-1" style={{ marginBottom: '2.5rem' }}>
        <Link href="/dashboard/teacher/attendance" className="card card-hover animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <Calendar size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Daily Attendance Sheets</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
              Mark who is present, absent, or excused for your active classrooms.
            </p>
          </div>
        </Link>

        <Link href="/dashboard/teacher/grades" className="card card-hover animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="stat-icon stat-icon-violet" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Academic Gradebook</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
              Review course subject maps and publish terminal scores directly.
            </p>
          </div>
        </Link>
      </div>

      <div className="responsive-grid-3-2">
        {/* Assigned Courses */}
        <div className="card animate-slide-up">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stat-icon stat-icon-emerald" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
              <BookOpen size={16} />
            </div>
            My Allocated Courses ({courses?.length || 0})
          </h3>

          {courses && courses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  style={{ 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: 'var(--radius)', 
                    padding: '1.25rem', 
                    backgroundColor: 'hsl(var(--muted) / 0.1)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontSize: '0.7rem', marginBottom: '0.4rem', display: 'inline-block' }}>
                      {course.subjects?.code}
                    </span>
                    <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>
                      {course.subjects?.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))' }}>
                      <Clock size={12} /> Class Section: <strong>{course.classes?.name}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link 
                      href={`/dashboard/teacher/attendance`}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <UserCheck size={12} /> Mark Attendance
                    </Link>
                    <Link 
                      href={`/dashboard/teacher/grades`}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Award size={12} /> Publish Grades
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={24} />
              </div>
              <p style={{ fontSize: '0.85rem' }}>You are not currently assigned to teach any classes. Please contact the registrar.</p>
            </div>
          )}
        </div>

        {/* Announcements Billboard */}
        <div className="card animate-slide-up" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stat-icon stat-icon-amber" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
              <Megaphone size={16} />
            </div>
            School Billboard
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <p style={{ fontSize: '0.85rem' }}>No active announcements on the billboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
