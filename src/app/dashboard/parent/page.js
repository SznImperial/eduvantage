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
  UserCheck,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';

export default function ParentPortal() {
  const supabase = createClient();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Child specific data
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Newly added details for the child
  const [timetable, setTimetable] = useState([]);
  const [cbtSubmissions, setCbtSubmissions] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Parent sub-tabs: 'overview' | 'timetable' | 'cbt' | 'finance'
  const [activeTab, setActiveTab] = useState('overview');

  // 1. Fetch children links
  const fetchChildren = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student IDs linked to parent
      const { data: links } = await supabase
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
          setSelectedChild(studentsData[0]);
        }
      }
      
      const { data: years } = await supabase.from('academic_years').select('*');
      if (years) setAcademicYears(years);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  // 2. Fetch selected child's reports
  const fetchChildData = async (student) => {
    if (!student) return;
    setDataLoading(true);
    try {
      // A. Fetch attendance logs
      const { data: attData } = await supabase
        .from('attendance')
        .select(`id, date, status, notes, classes (name)`)
        .eq('student_id', student.id)
        .order('date', { ascending: false });
      if (attData) setAttendance(attData);

      // B. Fetch grade marks
      const { data: gradeData } = await supabase
        .from('grades')
        .select(`
          id, grade_value, remarks, created_at,
          class_subjects (
            id, class_id, subjects (name, code)
          )
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      if (gradeData) setGrades(gradeData);

      // C. Fetch announcements from child's school
      const { data: annData } = await supabase
        .from('announcements')
        .select('id, title, content, created_at, profiles (first_name, last_name)')
        .eq('school_id', student.school_id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (annData) setAnnouncements(annData);

      // D. Fetch child's timetable
      const { data: enroll } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', student.id)
        .single();

      if (enroll) {
        const { data: classSubs } = await supabase
          .from('class_subjects')
          .select('*, subjects(name, code), profiles(first_name, last_name)')
          .eq('class_id', enroll.class_id);

        if (classSubs && classSubs.length > 0) {
          const classSubIds = classSubs.map(cs => cs.id);
          const { data: slots } = await supabase
            .from('timetable_slots')
            .select('*')
            .in('class_subject_id', classSubIds);

          if (slots) {
            const enriched = slots.map(s => {
              const cs = classSubs.find(x => x.id === s.class_subject_id);
              return {
                ...s,
                subjectName: cs?.subjects?.name || 'Subject',
                subjectCode: cs?.subjects?.code || '',
                teacherName: cs?.profiles ? `${cs.profiles.first_name} ${cs.profiles.last_name}` : 'Not assigned'
              };
            });
            setTimetable(enriched);
          }
        } else {
          setTimetable([]);
        }
      } else {
        setTimetable([]);
      }

      // E. Fetch CBT attempts
      const { data: cbtSubs } = await supabase
        .from('cbt_submissions')
        .select('*, cbt_exams(*)')
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false });
      setCbtSubmissions(cbtSubs || []);

      // F. Fetch fee records
      const { data: fees } = await supabase
        .from('fee_records')
        .select('*')
        .eq('student_id', student.id);
      setFeeRecords(fees || []);

    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
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

  // Timetable days
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Financial aggregates
  const totalBilled = feeRecords.reduce((sum, f) => sum + parseFloat(f.amount_owed), 0);
  const totalPaid = feeRecords.reduce((sum, f) => sum + parseFloat(f.amount_paid), 0);
  const outstandingBalance = totalBilled - totalPaid;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Parent Workspace</h1>
          <p>Monitor your child&apos;s academic progress, schedules, exam activities, and term billing ledgers.</p>
        </div>

        {/* Children switcher */}
        {children.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Select Child:</span>
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
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.125rem' }}>{averageGrade}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                <span>Total Graded Tasks</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{grades.length} scores</span>
              </div>
            </div>

            <div className="card card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon stat-icon-rose">
                  <CreditCard size={22} style={{ color: 'hsl(var(--destructive))' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unpaid school fees</span>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.125rem', color: 'hsl(var(--destructive))' }}>₦{outstandingBalance.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                <span>Billed total tuition</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>₦{totalBilled.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Tab Navigation inside parent view */}
          <div className="tab-nav" style={{ marginBottom: '1.5rem' }}>
            <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>
              <FileSpreadsheet size={15} /> Overview & Grades
            </button>
            <button onClick={() => setActiveTab('timetable')} className={`tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}>
              <Calendar size={15} /> Class Timetable
            </button>
            <button onClick={() => setActiveTab('cbt')} className={`tab-btn ${activeTab === 'cbt' ? 'active' : ''}`}>
              <ClipboardList size={15} /> Online tests (CBT)
            </button>
            <button onClick={() => setActiveTab('finance')} className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}>
              <CreditCard size={15} /> Financial Account
            </button>
          </div>

          {/* RENDER SELECTED TAB CONTENT */}
          {dataLoading ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : activeTab === 'overview' ? (
            <div className="responsive-grid-2-1">
              {/* Reports area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Report Card */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Child Report Card</h3>
                  <div className="table-container">
                    {grades.length > 0 ? (
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
                    {attendance.length > 0 ? (
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
                  {announcements.length > 0 ? (
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
          ) : activeTab === 'timetable' ? (
            /* TIMETABLE VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {days.map(day => {
                const daySlots = timetable
                  .filter(s => s.day_of_week === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div key={day} className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'hsl(var(--primary))' }}>
                      {day}
                    </h3>

                    {daySlots.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {daySlots.map(slot => (
                          <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--muted) / 0.12)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                                <Clock size={13} /> {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.9rem' }}>{slot.subjectName}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.5rem' }}>({slot.subjectCode})</span>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.15rem' }}>
                                  Instructor: <strong>{slot.teacherName}</strong>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                              <MapPin size={13} /> {slot.room}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', padding: '0.25rem 0' }}>No scheduled classes.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'cbt' ? (
            /* CBT EXAM LOGS */
            <div className="card">
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th style={{ textAlign: 'center' }}>Score Obtained</th>
                      <th style={{ textAlign: 'center' }}>Proctoring status</th>
                      <th>Submission date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cbtSubmissions.length > 0 ? (
                      cbtSubmissions.map(sub => {
                        const percentage = sub.total_questions > 0 ? ((sub.score / sub.total_questions) * 100).toFixed(0) : 0;
                        const released = sub.status === 'released';
                        return (
                          <tr key={sub.id}>
                            <td>
                              <strong>{sub.cbt_exams?.title || 'Unknown Exam'}</strong>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {released ? `${sub.score} / ${sub.total_questions} (${percentage}%)` : 'Score Withheld'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {sub.proctor_violated ? (
                                <span className="badge badge-error" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <ShieldAlert size={12} /> Lockout Violated
                                </span>
                              ) : sub.tab_switch_count > 0 || sub.noise_spike_count > 5 ? (
                                <span className="badge badge-error" style={{ fontSize: '0.7rem', backgroundColor: 'var(--warning)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <AlertTriangle size={12} /> Integrity Flagged
                                </span>
                              ) : (
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem', backgroundColor: 'var(--success)', color: 'white' }}>Passed</span>
                              )}
                            </td>
                            <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No computer-based tests logged for this student.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* FINANCIAL ACCOUNT */
            <div className="card">
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Billing Term</th>
                      <th>Billed Owed</th>
                      <th>Collected Paid</th>
                      <th>Remaining Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeRecords.length > 0 ? (
                      feeRecords.map(record => {
                        const balance = parseFloat(record.amount_owed) - parseFloat(record.amount_paid);
                        let badgeClass = 'badge badge-secondary';
                        if (record.status === 'paid') badgeClass = 'badge badge-primary';
                        else if (record.status === 'partial') badgeClass = 'badge badge-warning';
                        else if (record.status === 'unpaid') badgeClass = 'badge badge-error';

                        return (
                          <tr key={record.id}>
                            <td style={{ fontWeight: 650 }}>{record.term}</td>
                            <td>₦{parseFloat(record.amount_owed).toLocaleString()}</td>
                            <td>₦{parseFloat(record.amount_paid).toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: balance > 0 ? 'hsl(var(--destructive))' : 'inherit' }}>
                              ₦{balance.toLocaleString()}
                            </td>
                            <td>
                              <span className={badgeClass} style={{ fontSize: '0.75rem', backgroundColor: record.status === 'paid' ? 'var(--success)' : record.status === 'partial' ? 'var(--warning)' : '', color: record.status === 'paid' || record.status === 'partial' ? 'white' : '' }}>
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No bills or tuition invoice records found for this student.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
