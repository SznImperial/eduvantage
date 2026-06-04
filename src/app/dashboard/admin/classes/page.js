'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { BookOpen, Calendar, Plus, Users, Library, Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import { 
  createAcademicYearAction, 
  createClassAction, 
  createSubjectAction, 
  allocateCourseAction, 
  enrollStudentAction 
} from '@/app/actions';

export default function AdminClassesPage() {
  const supabase = createClient();
  
  // Data lists
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  
  // Tabs: 'classes' or 'assign' or 'enroll'
  const [activeTab, setActiveTab] = useState('classes');
  
  // Status states
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch all necessary data for dropdowns/tables
  const fetchData = async () => {
    // 1. Academic years
    const { data: years } = await supabase.from('academic_years').select('*').order('name', { ascending: false });
    if (years) setAcademicYears(years);

    // 2. Classes
    const { data: cls } = await supabase.from('classes').select('*, academic_years(name)').order('name');
    if (cls) setClasses(cls);

    // 3. Subjects
    const { data: sub } = await supabase.from('subjects').select('*').order('name');
    if (sub) setSubjects(sub);

    // 4. Teachers
    const { data: tch } = await supabase.from('profiles').select('*').eq('role', 'teacher').order('first_name');
    if (tch) setTeachers(tch);

    // 5. Students
    const { data: std } = await supabase.from('profiles').select('*').eq('role', 'student').order('first_name');
    if (std) setStudents(std);

    // 6. Class subjects with relation
    const { data: map } = await supabase.from('class_subjects').select('*, classes(name), subjects(name), profiles(first_name, last_name)');
    if (map) setClassSubjects(map);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form Submissions
  // A. Create Academic Year
  const handleCreateYear = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');

    const result = await createAcademicYearAction(name, start_date, end_date);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Academic year created successfully!');
      e.target.reset();
      fetchData();
    }
  };

  // B. Create Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const grade_level = formData.get('grade_level');
    const academic_year_id = formData.get('academic_year_id');

    const result = await createClassAction(name, grade_level, academic_year_id);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Class created successfully!');
      e.target.reset();
      fetchData();
    }
  };

  // C. Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const code = formData.get('code');

    const result = await createSubjectAction(name, code);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Subject created successfully!');
      e.target.reset();
      fetchData();
    }
  };

  // D. Map Subject to Class with Teacher
  const handleMapSubject = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const class_id = formData.get('class_id');
    const subject_id = formData.get('subject_id');
    const teacher_id = formData.get('teacher_id') || '';

    const result = await allocateCourseAction(class_id, subject_id, teacher_id);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Subject mapped to class successfully!');
      e.target.reset();
      fetchData();
    }
  };

  // E. Enroll Student in Class
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const student_id = formData.get('student_id');
    const class_id = formData.get('class_id');

    const result = await enrollStudentAction(student_id, class_id);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Student enrolled in class successfully!');
      e.target.reset();
      fetchData();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Classes & Subjects Infrastructure</h1>
        <p>Define term periods, manage classroom sections, catalog courses, and set up assignments.</p>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        <button 
          onClick={() => { setActiveTab('classes'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
        >
          <BookOpen size={16} /> Classes & Subjects
        </button>
        <button 
          onClick={() => { setActiveTab('assign'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'assign' ? 'active' : ''}`}
        >
          <Library size={16} /> Course Allocation
        </button>
        <button 
          onClick={() => { setActiveTab('enroll'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'enroll' ? 'active' : ''}`}
        >
          <Users size={16} /> Student Enrollment
        </button>
      </div>

      {/* Feedback alerts */}
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

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'classes' && (
        <div className="responsive-grid-15-1">
          {/* Left panel: List classes & academic terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="stat-icon stat-icon-indigo" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Calendar size={16} />
                </div>
                Active Classes
              </h3>
              <div className="table-container">
                {classes.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Grade Level</th>
                        <th>Term Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls.id}>
                          <td style={{ fontWeight: 600 }}>{cls.name}</td>
                          <td>Grade {cls.grade_level}</td>
                          <td>{cls.academic_years?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <p>No classes set up yet. Create a class on the right.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="stat-icon stat-icon-violet" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Library size={16} />
                </div>
                Catalog of Subjects
              </h3>
              <div className="table-container">
                {subjects.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Subject Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub) => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 600 }}>{sub.name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{sub.code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <p>No subjects in the catalog. Add one on the right.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Forms to create */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Create Term / Academic Year</h4>
              <form onSubmit={handleCreateYear}>
                <div className="form-group">
                  <label className="form-label">Term Name</label>
                  <input className="input" name="name" placeholder="e.g. 2025-2026 Fall" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="input" name="start_date" type="date" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="input" name="end_date" type="date" required />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.25rem' }}>
                  <Plus size={16} /> Create Term
                </button>
              </form>
            </div>

            <div className="card glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Create Class Section</h4>
              <form onSubmit={handleCreateClass}>
                <div className="form-group">
                  <label className="form-label">Class Name</label>
                  <input className="input" name="name" placeholder="e.g. Grade 10 - Blue" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Grade Level</label>
                    <input className="input" name="grade_level" type="text" placeholder="e.g. 10" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <select className="input" name="academic_year_id" required>
                      <option value="">Select term...</option>
                      {academicYears.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.25rem' }}>
                  <Plus size={16} /> Create Class
                </button>
              </form>
            </div>

            <div className="card glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Create Subject</h4>
              <form onSubmit={handleCreateSubject}>
                <div className="form-group">
                  <label className="form-label">Subject Name</label>
                  <input className="input" name="name" placeholder="e.g. English Literature" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Code</label>
                  <input className="input" name="code" placeholder="e.g. ENG-101" required />
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.25rem' }}>
                  <Plus size={16} /> Create Subject
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="responsive-grid-15-1">
          {/* Left panel: Allocated allocations */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="stat-icon stat-icon-amber" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                <Library size={16} />
              </div>
              Allocated Teacher Assignments
            </h3>
            <div className="table-container">
              {classSubjects.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Assigned Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classSubjects.map((map) => (
                      <tr key={map.id}>
                        <td style={{ fontWeight: 600 }}>{map.classes?.name}</td>
                        <td>{map.subjects?.name}</td>
                        <td>
                          {map.profiles ? (
                            <span className="badge badge-success">
                              {map.profiles.first_name} {map.profiles.last_name}
                            </span>
                          ) : (
                            <span className="badge badge-secondary">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No subject allocations mapped yet. Set up one on the right.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Allocator form */}
          <div className="card glass-panel" style={{ height: 'fit-content' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Allocate Course to Teacher</h4>
            <form onSubmit={handleMapSubject}>
              <div className="form-group">
                <label className="form-label">Class Section</label>
                <select className="input" name="class_id" required>
                  <option value="">Select class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="input" name="subject_id" required>
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Teacher (Optional)</label>
                <select className="input" name="teacher_id">
                  <option value="">Leave Unassigned / Select Teacher...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                <Award size={16} /> Allocate Course
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'enroll' && (
        <div className="responsive-grid-15-1">
          {/* Left panel: List classes and enrolled students count */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="stat-icon stat-icon-emerald" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                <Users size={16} />
              </div>
              School Enrollments
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
              View class directories or allocate students to classrooms.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classes.map((c) => (
                <div key={c.id} className="announcement-card">
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'hsl(var(--accent-indigo-text))' }}>
                    {c.name} ({c.academic_years?.name})
                  </div>
                  
                  {/* Inner table or list of students in this class */}
                  <StudentList classId={c.id} supabase={supabase} />
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Enroller form */}
          <div className="card glass-panel" style={{ height: 'fit-content' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Enroll Student</h4>
            <form onSubmit={handleEnrollStudent}>
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="input" name="student_id" required>
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Class Section</label>
                <select className="input" name="class_id" required>
                  <option value="">Select classroom...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                <Plus size={16} /> Enroll in Class
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Child component to fetch students enrolled in a specific class
function StudentList({ classId, supabase }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, profiles(first_name, last_name, email)')
        .eq('class_id', classId);

      if (!error && data) {
        setStudents(data);
      }
      setLoading(false);
    };

    fetchStudents();
  }, [classId, supabase]);

  if (loading) return <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>Loading directory...</div>;

  return (
    <div>
      {students.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {students.map((st) => (
            <span key={st.id} className="badge badge-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
              {st.profiles?.first_name} {st.profiles?.last_name}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
          No students enrolled in this section.
        </div>
      )}
    </div>
  );
}
