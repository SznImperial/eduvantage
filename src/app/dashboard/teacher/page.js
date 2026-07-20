import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import {
  Calendar,
  FileSpreadsheet,
  BookOpen,
  Clock,
  Megaphone,
  ArrowRight,
  Award,
} from 'lucide-react';

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from('class_subjects')
    .select('id, classes(id, name), subjects(name, code)')
    .eq('teacher_id', user.id);

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="animate-fade-in pb-5xl">
      <div className="page-header">
        <h1>Teacher workspace</h1>
        <p>Record attendance, manage grades, and review exam results for your classes.</p>
      </div>

      <div className="responsive-grid-1-1 mb-2xl">
        <Link href="/dashboard/teacher/attendance" className="card card-hover flex items-center gap-lg">
          <div className="stat-icon stat-icon-indigo" style={{ width: 48, height: 48 }}>
            <Calendar size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-xs">Daily attendance</h3>
            <p className="text-sm text-muted leading-relaxed">
              Mark present, absent, or excused for your classrooms.
            </p>
          </div>
        </Link>

        <Link href="/dashboard/teacher/grades" className="card card-hover flex items-center gap-lg">
          <div className="stat-icon stat-icon-violet" style={{ width: 48, height: 48 }}>
            <FileSpreadsheet size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-xs">Gradebook</h3>
            <p className="text-sm text-muted leading-relaxed">
              Enter and publish terminal scores for your subjects.
            </p>
          </div>
        </Link>
      </div>

      <div className="responsive-grid-3-2">
        <div className="card">
          <h3 className="text-lg font-bold mb-lg flex items-center gap-sm">
            <div className="stat-icon stat-icon-emerald">
              <BookOpen size={16} strokeWidth={1.75} />
            </div>
            Allocated courses ({courses?.length || 0})
          </h3>

          {courses && courses.length > 0 ? (
            <div className="flex flex-col gap-md">
              {courses.map((course) => (
                <div key={course.id} className="notification-card flex flex-wrap justify-between items-center gap-md">
                  <div>
                    <span className="badge badge-primary mb-xs" style={{ display: 'inline-block', fontFamily: 'ui-monospace, monospace' }}>
                      {course.subjects?.code}
                    </span>
                    <h4 className="font-bold text-foreground mb-xs">
                      {course.subjects?.name}
                    </h4>
                    <div className="flex items-center gap-xs text-sm text-muted">
                      <Clock size={12} strokeWidth={1.75} />
                      <span>{course.classes?.name}</span>
                    </div>
                  </div>

                  <div className="flex gap-sm flex-wrap">
                    <Link href="/dashboard/teacher/attendance" className="btn btn-secondary btn-sm">
                      Attendance
                    </Link>
                    <Link href="/dashboard/teacher/grades" className="btn btn-outline btn-sm">
                      Grades
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={18} strokeWidth={1.75} />
              </div>
              <p>No courses assigned yet. Contact your administrator.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-lg">
          <div className="card">
            <h3 className="text-lg font-bold mb-lg flex items-center gap-sm">
              <div className="stat-icon stat-icon-amber">
                <Megaphone size={16} strokeWidth={1.75} />
              </div>
              Announcements
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

          <div className="card">
            <h3 className="text-lg font-bold mb-lg">Shortcuts</h3>
            <div className="quick-nav">
              <Link href="/dashboard/teacher/assignments" className="quick-nav-link">
                <span>Assignments</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/teacher/cbt" className="quick-nav-link">
                <span className="quick-nav-link-inner">
                  <Award size={14} strokeWidth={1.75} />
                  CBT exams
                </span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/teacher/timetable" className="quick-nav-link">
                <span>Timetable</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
