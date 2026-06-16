'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  Megaphone, 
  Loader2, 
  GraduationCap,
  Award,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function ParentPortal() {
  const supabase = createClient();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // 1. Fetch children links
  const fetchChildren = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch student IDs linked to parent
    const { data: links, error: linkErr } = await supabase
      .from('parent_student')
      .select('student_id')
      .eq('parent_id', user.id);

    if (links && links.length > 0) {
      const studentIds = links.map(l => l.student_id);

      // Fetch student profiles
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, school_id')
        .in('id', studentIds);

      if (studentsData) {
        setChildren(studentsData);
        setSelectedChild(studentsData[0]); // Default to first child
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  // 2. Fetch selected child's reports
  const fetchChildData = async (student) => {
    if (!student) return;
    setDataLoading(true);

    // Fetch attendance logs
    const { data: attData } = await supabase
      .from('attendance')
      .select(`
        id, 
        date, 
        status, 
        notes,
        classes (name)
      `)
      .eq('student_id', student.id)
      .order('date', { ascending: false });

    // Fetch grade marks
    const { data: gradeData } = await supabase
      .from('grades')
      .select(`
        id,
        grade_value,
        remarks,
        created_at,
        class_subjects (
          subjects (name, code)
        )
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    // Fetch announcements from child's school
    const { data: annData } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, profiles (first_name, last_name)')
      .eq('school_id', student.school_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (attData) setAttendance(attData);
    if (gradeData) setGrades(gradeData);
    if (annData) setAnnouncements(annData);
    setDataLoading(false);
  };

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
    }
  }, [selectedChild]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
        <Loader2 className="animate-spin" />
        <span>Syncing family dashboard...</span>
      </div>
    );
  }

  // Statistics helper calculations
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : '—';

  const averageGrade = grades.length > 0 
    ? (grades.reduce((sum, g) => sum + Number(g.grade_value), 0) / grades.length).toFixed(1) 
    : '—';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Parent Workspace</h1>
          <p>Monitor your child&apos;s academic progress, grade distributions, and daily school activities.</p>
        </div>

        {/* Children switcher */}
        {children.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Select Student:</span>
            <select 
              className="input" 
              style={{ minWidth: '180px', height: '38px', fontSize: '0.875rem', margin: 0 }}
              value={selectedChild ? selectedChild.id : ''}
              onChange={(e) => {
                const child = children.find(c => c.id === e.target.value);
                if (child) setSelectedChild(child);
              }}
            >
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {children.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 2rem' }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 1rem' }}>
            <Users size={32} />
          </div>
          <h3>No Student Links Found</h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem', color: 'hsl(var(--muted-foreground))' }}>
            Your account is currently not linked to any registered students. Please ask your school administrator to link your profile using your email.
          </p>
        </div>
      ) : (
        <>
          {/* Key metrics cards */}
          <div className="dashboard-grid" style={{ marginBottom: '2.25rem' }}>
            
            <div className="card card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon stat-icon-indigo">
                  <UserCheck size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Rate</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.125rem' }}>{attendanceRate}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                <span>Present/Late days</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{presentDays} / {totalDays} days log</span>
              </div>
            </div>

            <div className="card card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon stat-icon-emerald">
                  <Award size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade Point Average</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.125rem' }}>{averageGrade}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                <span>Total Graded Tasks</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{grades.length} scores</span>
              </div>
            </div>

            <div className="card card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon stat-icon-violet">
                  <GraduationCap size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Profile</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedChild?.first_name} {selectedChild?.last_name}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                <span>School Identifier</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{selectedChild?.school_id.substring(0,8)}...</span>
              </div>
            </div>

          </div>

          <div className="responsive-grid-2-1">
            
            {/* Reports area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Report Card */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Child Report Card</h3>
                <div className="table-container">
                  {dataLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : grades.length > 0 ? (
                    <table className="table" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Score</th>
                          <th>Evaluation / Remarks</th>
                          <th>Date Graded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((grade) => (
                          <tr key={grade.id}>
                            <td style={{ fontWeight: 600 }}>
                              {grade.class_subjects?.subjects?.name || 'Class Subject'}
                              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'block', fontWeight: 400 }}>
                                {grade.class_subjects?.subjects?.code}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                Number(grade.grade_value) >= 80 ? 'badge-primary' :
                                Number(grade.grade_value) >= 50 ? 'badge-secondary' : 'badge-danger'
                              }`} style={{ fontWeight: 700 }}>
                                {grade.grade_value}%
                              </span>
                            </td>
                            <td>{grade.remarks || 'No remarks provided.'}</td>
                            <td>{new Date(grade.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <FileSpreadsheet size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <p>No grades published for this student yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Logs */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Attendance Log</h3>
                <div className="table-container">
                  {dataLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : attendance.length > 0 ? (
                    <table className="table" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Class Section</th>
                          <th>Status</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((log) => (
                          <tr key={log.id}>
                            <td>{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td>{log.classes?.name || 'School Class'}</td>
                            <td>
                              <span className={`badge ${
                                log.status === 'present' ? 'badge-primary' :
                                log.status === 'late' ? 'badge-indigo' :
                                log.status === 'absent' ? 'badge-danger' : 'badge-secondary'
                              }`} style={{ textTransform: 'capitalize' }}>
                                {log.status}
                              </span>
                            </td>
                            <td>{log.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <Calendar size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <p>No attendance registers logged yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* School announcements */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} style={{ color: 'hsl(var(--accent-indigo-text))' }} /> School Billboard
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dataLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
                    <Loader2 className="animate-spin" />
                  </div>
                ) : announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann.id} className="announcement-card" style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                        <h4 style={{ fontWeight: 650, fontSize: '0.9rem', margin: 0 }}>{ann.title}</h4>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.45, margin: '0 0 0.5rem 0' }}>
                        {ann.content}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--accent-indigo-text))', fontWeight: 600 }}>
                        Posted by: {ann.profiles?.first_name} {ann.profiles?.last_name}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '1.5rem' }}>
                    No announcements published by the school yet.
                  </p>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
