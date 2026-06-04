import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Calendar, FileSpreadsheet, BookOpen, Clock, Megaphone } from 'lucide-react';

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch classes assigned to this teacher
  const { data: courses, error: errC } = await supabase
    .from('class_subjects')
    .select('id, classes(id, name), subjects(name, code)')
    .eq('teacher_id', user.id);

  // Fetch latest 3 announcements
  const { data: announcements, error: errA } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Teacher Workspace</h1>
        <p>
          Quick access to record daily attendance sheets and manage academic gradebooks.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="responsive-grid-1-1" style={{ marginBottom: '2.5rem' }}>
        <Link href="/dashboard/teacher/attendance" className="card card-hover animate-slide-up stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <Calendar size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Daily Attendance Sheet</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>Mark who is present, absent, or excused for your active classes.</p>
          </div>
        </Link>

        <Link href="/dashboard/teacher/grades" className="card card-hover animate-slide-up stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="stat-icon stat-icon-violet" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Academic Gradebook</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>Review subject maps and enter students&apos; mid-term or terminal exam marks.</p>
          </div>
        </Link>
      </div>

      <div className="responsive-grid-3-2">
        {/* Assigned Courses */}
        <div className="card animate-slide-up stagger-3">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stat-icon stat-icon-emerald" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
              <BookOpen size={16} />
            </div>
            My Assigned Courses
          </h3>

          {courses && courses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {courses.map((course) => (
                <div key={course.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', padding: '1.25rem', backgroundColor: 'hsl(var(--muted) / 0.2)', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}>
                  <span className="badge badge-primary" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: '0.7rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                    {course.subjects?.code}
                  </span>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                    {course.subjects?.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                    <Clock size={14} /> Class Section: <strong>{course.classes?.name}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={24} />
              </div>
              <p>You are not currently assigned to teach any classes. Please contact the administrator.</p>
            </div>
          )}
        </div>

        {/* Announcements Billboard */}
        <div className="card animate-slide-up stagger-4">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stat-icon stat-icon-amber" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
              <Megaphone size={16} />
            </div>
            School Billboard
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="announcement-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ann.title}</h4>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                    {ann.content.length > 120 ? ann.content.substring(0, 120) + '...' : ann.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={24} />
                </div>
                <p>No active announcements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
