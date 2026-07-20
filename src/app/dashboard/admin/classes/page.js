'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { BookOpen, Calendar, Plus, Users, Library, Award, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { 
  createAcademicYearAction, 
  createClassAction, 
  deleteClassAction,
  createSubjectAction, 
  allocateCourseAction, 
  enrollStudentAction,
  toggleStudentSubjectAction,
  setActiveSessionAction,
  createAcademicTermAction
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
  const [enrollments, setEnrollments] = useState([]);
  const [activeSchoolYearId, setActiveSchoolYearId] = useState(null);
  const [activeSchoolTermId, setActiveSchoolTermId] = useState(null);
  
  // Tabs: 'classes' or 'assign' or 'enroll'
  const [activeTab, setActiveTab] = useState('classes');

  // Electives manager states
  const [electiveClassId, setElectiveClassId] = useState('');
  const [electiveStudentId, setElectiveStudentId] = useState('');
  const [electiveSubjects, setElectiveSubjects] = useState([]);
  
  // Status states
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch all necessary data for dropdowns/tables
  const fetchData = async () => {
    // 1. Academic years and active sessions
    const { data: { user } } = await supabase.auth.getUser();
    
    const [yearsRes, profileRes] = await Promise.all([
      supabase.from('academic_years').select('*, academic_terms(*)').order('name', { ascending: false }),
      supabase.from('profiles').select('schools(active_academic_year_id, active_academic_term_id)').eq('id', user.id).single()
    ]);

    if (yearsRes.data) setAcademicYears(yearsRes.data);
    if (profileRes.data) {
      setActiveSchoolYearId(profileRes.data.schools?.active_academic_year_id);
      setActiveSchoolTermId(profileRes.data.schools?.active_academic_term_id);
    }

    // 2. Classes
    const { data: cls } = await supabase.from('classes').select('*').order('name');
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

    // 7. Enrollments
    const { data: enr } = await supabase.from('enrollments').select('*');
    if (enr) setEnrollments(enr);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchElectiveSubjects = async () => {
    if (!electiveStudentId) return;
    const { data } = await supabase.from('student_subjects').select('*').eq('student_id', electiveStudentId);
    if (data) setElectiveSubjects(data);
  };

  useEffect(() => {
    fetchElectiveSubjects();
  }, [electiveStudentId]);

  const handleToggleElective = async (classSubjectId, isChecked) => {
    setError(''); setSuccess('');
    const res = await toggleStudentSubjectAction(electiveStudentId, classSubjectId, isChecked);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(isChecked ? 'Subject mapped successfully!' : 'Subject removed from student roster.');
      fetchElectiveSubjects();
    }
  };

  // Form Submissions
  // A. Create Academic Year
  const handleCreateYear = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const name = formData.get('name');

    const result = await createAcademicYearAction(name, null, null);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Academic year created successfully!');
      e.target.reset();
      fetchData();
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const academic_year_id = formData.get('academic_year_id');
    const name = formData.get('name');
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');

    const result = await createAcademicTermAction(academic_year_id, name, start_date, end_date);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Custom term created successfully!');
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

    const result = await createClassAction(name, grade_level);

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
        <button 
          onClick={() => { setActiveTab('electives'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'electives' ? 'active' : ''}`}
        >
          <Award size={16} /> Class Electives
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
          {/* Left panel: List sessions, classes & academic terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="stat-icon stat-icon-violet" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Calendar size={16} />
                </div>
                Academic Terms & Sessions
              </h3>
              <div className="table-container">
                {academicYears.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Term Name</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicYears.map((year) => (
                        <tr key={year.id}>
                          <td style={{ fontWeight: 650 }}>{year.name}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                          </td>
                          <td>
                            {activeSchoolYearId === year.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className="badge badge-success">Active Session</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Term: {year.academic_terms?.find(t => t.id === activeSchoolTermId)?.name || 'None'}
                                </span>
                              </div>
                            ) : (
                              <span className="badge badge-secondary">Inactive</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                              <select 
                                className="input" 
                                style={{ padding: '0.1rem 0.2rem', fontSize: '0.7rem', width: 'auto' }}
                                onChange={async (e) => {
                                  if (!e.target.value) return;
                                  setError(''); setSuccess('');
                                  const res = await setActiveSessionAction(year.id, e.target.value);
                                  if (res?.error) setError(res.error);
                                  else {
                                    setSuccess(`Successfully activated session: ${year.name}!`);
                                    fetchData();
                                  }
                                }}
                                value={activeSchoolYearId === year.id ? activeSchoolTermId : ''}
                              >
                                <option value="">Set Active Term...</option>
                                {year.academic_terms?.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>No academic years registered yet. Add one on the right.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="stat-icon stat-icon-indigo" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <BookOpen size={16} />
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
                        <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls.id}>
                          <td style={{ fontWeight: 600 }}>{cls.name}</td>
                          <td>Grade {cls.grade_level}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '0.25rem 0.5rem', color: 'hsl(var(--destructive, 0 84% 60%))' }}
                              title="Delete class"
                              onClick={async () => {
                                if (!window.confirm(`Are you sure you want to delete "${cls.name}"? This will also remove all enrollments, subjects, and attendance records for this class.`)) return;
                                setError('');
                                setSuccess('');
                                const res = await deleteClassAction(cls.id);
                                if (res?.error) {
                                  setError(res.error);
                                } else {
                                  setSuccess(`Class "${cls.name}" deleted successfully.`);
                                  fetchData();
                                }
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
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
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>No subjects in the catalog. Add one on the right.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Forms to create */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Create Academic Year (Session)</h4>
              <form onSubmit={handleCreateYear}>
                <div className="form-group">
                  <label className="form-label">Academic Year Name</label>
                  <input className="input" name="name" placeholder="e.g. 2025/2026 Session" required />
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.25rem' }}>
                  <Plus size={16} /> Create Year
                </button>
              </form>
            </div>

            <div className="card glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>Create Custom Term</h4>
              <form onSubmit={handleCreateTerm}>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <select className="input" name="academic_year_id" required>
                    <option value="">Select Year...</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Term Name</label>
                  <input className="input" name="name" placeholder="e.g. Summer Term" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="input" name="start_date" type="date" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="input" name="end_date" type="date" />
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
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <input className="input" name="grade_level" type="text" placeholder="e.g. 10" required />
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
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
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

      {activeTab === 'electives' && (
        <div className="responsive-grid-15-1">
          {/* Left panel: select class and student */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Select Student
            </h3>
            <div className="form-group">
              <label className="form-label">Class Section</label>
              <select className="input" value={electiveClassId} onChange={(e) => {
                setElectiveClassId(e.target.value);
                setElectiveStudentId('');
                setElectiveSubjects([]);
              }}>
                <option value="">Select class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {electiveClassId && (
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Student</label>
                <select className="input" value={electiveStudentId} onChange={(e) => setElectiveStudentId(e.target.value)}>
                  <option value="">Select student...</option>
                  {enrollments.filter(en => en.class_id === electiveClassId).map(en => {
                    const std = students.find(s => s.id === en.student_id);
                    return std ? (
                      <option key={std.id} value={std.id}>{std.first_name} {std.last_name}</option>
                    ) : null;
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Right panel: Active subjects checklist */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Subject Registrations
            </h3>
            {!electiveStudentId ? (
              <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Select a student to manage their elective subject enrollments.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                  Toggle the subjects below to customize this student's academic registry.
                </p>
                {classSubjects.filter(cs => cs.class_id === electiveClassId).map(cs => {
                  const sub = subjects.find(s => s.id === cs.subject_id);
                  const isEnrolled = electiveSubjects.some(es => es.class_subject_id === cs.id);
                  return (
                    <label key={cs.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: isEnrolled ? 'hsl(var(--muted) / 0.1)' : 'transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={isEnrolled}
                        onChange={(e) => handleToggleElective(cs.id, e.target.checked)}
                      />
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{sub ? sub.name : 'Unknown'}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.5rem' }}>({sub?.code})</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
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
