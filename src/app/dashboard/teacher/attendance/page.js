'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Calendar, Save, CheckCircle2, ShieldAlert, Users, Loader2 } from 'lucide-react';
import { saveAttendanceAction } from '@/app/actions';

export default function TeacherAttendancePage() {
  const supabase = createClient();
  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId -> { status, notes }
  
  // Loading & status
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch teacher's classes
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('class_subjects')
        .select('id, classes(id, name)')
        .eq('teacher_id', user.id);

      if (!error && data) {
        // Group by class to avoid duplicates if teaching multiple subjects to same class
        const classMap = {};
        data.forEach(item => {
          if (item.classes) {
            classMap[item.classes.id] = item.classes;
          }
        });
        setCourses(Object.values(classMap));
      }
      setLoadingCourses(false);
    };

    fetchCourses();
  }, [supabase]);

  // Fetch students and their current attendance records for selected class and date
  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setStudents([]);
      return;
    }

    const fetchStudentsAndAttendance = async () => {
      setLoadingStudents(true);
      setError(''); setSuccess('');

      // 1. Fetch students enrolled in selected class
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('student_id, profiles(id, first_name, last_name, email)')
        .eq('class_id', selectedClass);

      if (enrollError) {
        setError(enrollError.message);
        setLoadingStudents(false);
        return;
      }

      const classStudents = enrollments.map(e => e.profiles).filter(Boolean);
      setStudents(classStudents);

      // 2. Fetch existing attendance records for this date
      const { data: existingAttendance, error: attError } = await supabase
        .from('attendance')
        .select('student_id, status, notes')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      if (attError) {
        setError(attError.message);
        setLoadingStudents(false);
        return;
      }

      // Populate form state: default to 'present' for students without records
      const records = {};
      classStudents.forEach(st => {
        const existing = existingAttendance.find(att => att.student_id === st.id);
        records[st.id] = {
          status: existing ? existing.status : 'present',
          notes: existing ? (existing.notes || '') : ''
        };
      });

      setAttendanceRecords(records);
      setLoadingStudents(false);
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate, supabase]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(''); setSuccess('');

    // Prepare upsert payroll
    const upsertRecords = students.map(st => ({
      student_id: st.id,
      status: attendanceRecords[st.id].status,
      notes: attendanceRecords[st.id].notes || null
    }));

    // Perform Server Action call
    const result = await saveAttendanceAction(selectedClass, selectedDate, upsertRecords);

    if (result?.error) {
      setError(`Failed to save: ${result.error}`);
    } else {
      setSuccess('Attendance sheet locked and saved successfully!');
    }
    setSaving(false);
  };

  const statusColors = {
    present:  { bg: 'hsl(var(--accent-emerald))',  color: 'hsl(var(--accent-emerald-text))' },
    absent:   { bg: 'hsl(var(--accent-rose))',      color: 'hsl(var(--accent-rose-text))' },
    late:     { bg: 'hsl(var(--accent-amber))',     color: 'hsl(var(--accent-amber-text))' },
    excused:  { bg: 'hsl(var(--secondary))',         color: 'hsl(var(--secondary-foreground))' },
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <h1>Daily Attendance Sheet</h1>
        <p>
          Select a class and date, mark student attendance statuses, and commit changes.
        </p>
      </div>

      <div className="card animate-slide-up stagger-1 responsive-grid-15-1" style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Class Section</label>
          {loadingCourses ? (
            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Loading assigned classes...</div>
          ) : (
            <select 
              className="input" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose class...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Attendance Date</label>
          <input 
            className="input" 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </div>
      </div>

      {/* Feedback Panel */}
      {error && (
        <div className="alert alert-error">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Student Sheet */}
      {selectedClass ? (
        loadingStudents ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 className="animate-spin" />
            <span>Fetching class roster...</span>
          </div>
        ) : students.length > 0 ? (
          <div className="card animate-slide-up stagger-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 700 }}>
                <div className="stat-icon stat-icon-indigo" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Users size={16} />
                </div>
                <span>Class Roster ({students.length} Students)</span>
              </div>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Attendance
                  </>
                )}
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Attendance Status</th>
                    <th>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const record = attendanceRecords[student.id] || { status: 'present', notes: '' };
                    return (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 600, width: '30%' }}>
                          {student.first_name} {student.last_name}
                        </td>
                        <td style={{ width: '40%' }}>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {['present', 'absent', 'late', 'excused'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '9999px',
                                  textTransform: 'capitalize',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  backgroundColor: record.status === status 
                                    ? statusColors[status].bg 
                                    : 'hsl(var(--muted) / 0.4)',
                                  color: record.status === status
                                    ? statusColors[status].color
                                    : 'hsl(var(--muted-foreground))',
                                  fontWeight: record.status === status ? 650 : 500,
                                  fontFamily: 'inherit',
                                  boxShadow: record.status === status ? 'var(--shadow-xs)' : 'none'
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="input" 
                            placeholder="Add note..." 
                            value={record.notes} 
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={24} />
              </div>
              <p>No students are currently enrolled in this class.</p>
            </div>
          </div>
        )
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={24} />
            </div>
            <p>Please select an active class section from the dropdown list.</p>
          </div>
        </div>
      )}
    </div>
  );
}
