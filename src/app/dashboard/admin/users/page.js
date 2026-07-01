'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  createUserAccount, 
  deleteUserAction, 
  promoteStudentsAction,
  resolvePasswordResetRequestAction
} from '@/app/actions';
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  BadgeCheck, 
  Trash2, 
  Phone, 
  GraduationCap, 
  Key, 
  ClipboardCopy, 
  Search,
  UserCheck
} from 'lucide-react';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  // Data states
  const [profiles, setProfiles] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [parentLinks, setParentLinks] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Form states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showReissueModal, setShowReissueModal] = useState(false);
  
  const [generatedTempPassword, setGeneratedTempPassword] = useState('');
  const [reissueTargetEmail, setReissueTargetEmail] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // Promotions form states
  const [promoSourceClassId, setPromoSourceClassId] = useState('');
  const [promoTargetClassId, setPromoTargetClassId] = useState('');
  const [selectedPromoStudentIds, setSelectedPromoStudentIds] = useState([]);
  const [promoting, setPromoting] = useState(false);

  // Student form parent registration type
  const [parentType, setParentType] = useState('new');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profilesList } = await supabase.from('profiles').select('*');
      if (profilesList) setProfiles(profilesList);

      // 2. Fetch teachers metadata
      const { data: teachersList } = await supabase.from('teachers').select('*');
      if (teachersList) setTeachers(teachersList);

      // 3. Fetch classes
      const { data: classesList } = await supabase.from('classes').select('*').order('name');
      if (classesList) {
        setClasses(classesList);
        if (classesList.length > 0) {
          setPromoSourceClassId(classesList[0].id);
          if (classesList.length > 1) {
            setPromoTargetClassId(classesList[1].id);
          } else {
            setPromoTargetClassId('graduate');
          }
        }
      }

      // 4. Fetch enrollments
      const { data: enrollmentsList } = await supabase.from('enrollments').select('*, classes(*)');
      if (enrollmentsList) setEnrollments(enrollmentsList);

      // 5. Fetch parent_student mapping
      const { data: parentStudentList } = await supabase.from('parent_student').select('*');
      if (parentStudentList) setParentLinks(parentStudentList);

      // 6. Fetch password reset requests
      const { data: resetsList } = await supabase.from('password_reset_requests').select('*').order('created_at', { ascending: false });
      if (resetsList) setResetRequests(resetsList);
    } catch (err) {
      console.error('Error fetching registry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected promotion list checkmarks when source class changes
  useEffect(() => {
    if (promoSourceClassId) {
      const classStudents = enrollments.filter(e => e.class_id === promoSourceClassId).map(e => e.student_id);
      setSelectedPromoStudentIds(classStudents);

      const currentIndex = classes.findIndex(c => c.id === promoSourceClassId);
      if (currentIndex !== -1 && currentIndex + 1 < classes.length) {
        setPromoTargetClassId(classes[currentIndex + 1].id);
      } else {
        setPromoTargetClassId('graduate');
      }
    } else {
      setSelectedPromoStudentIds([]);
    }
  }, [promoSourceClassId, enrollments, classes]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const formData = new FormData(e.currentTarget);
    formData.append('role', 'student');
    formData.append('parentType', parentType);

    // If student email is optional and not provided, generate a temp email
    const sEmail = formData.get('email');
    const admissionNo = formData.get('admissionNo') || `STD-${Date.now()}`;
    if (!sEmail) {
      const cleanAdNo = admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '');
      formData.set('email', `student.${cleanAdNo}@eduvantage.temp`);
      formData.set('password', `PASS-${cleanAdNo}`);
    }

    startTransition(async () => {
      const result = await createUserAccount(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Student record and parent mappings synced successfully!');
        setShowStudentModal(false);
        fetchData();
      }
    });
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const formData = new FormData(e.currentTarget);
    formData.append('role', 'teacher');

    startTransition(async () => {
      const result = await createUserAccount(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Teacher profile and qualification record registered successfully!');
        setShowTeacherModal(false);
        fetchData();
      }
    });
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the user account for ${name}?`)) return;
    setError(''); setSuccess('');
    const result = await deleteUserAction(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(`Successfully deleted user account for ${name}.`);
      fetchData();
    }
  };

  const handlePromoteStudents = async (e) => {
    e.preventDefault();
    if (!promoSourceClassId || !promoTargetClassId || selectedPromoStudentIds.length === 0) return;

    setPromoting(true);
    setError(''); setSuccess('');
    const result = await promoteStudentsAction(selectedPromoStudentIds, promoTargetClassId);
    setPromoting(false);

    if (result?.error) {
      setError(result.error);
    } else {
      const targetLabel = promoTargetClassId === 'graduate' ? 'Graduated/Archive' : classes.find(c => c.id === promoTargetClassId)?.name || 'New Class';
      setSuccess(`Successfully promoted ${selectedPromoStudentIds.length} students to ${targetLabel}!`);
      fetchData();
    }
  };

  const handleReissuePassword = async (request) => {
    setError(''); setSuccess('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randCode = '';
    for (let i = 0; i < 6; i++) {
      randCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const tempPass = `EDU-TEMP-${randCode}`;

    const result = await resolvePasswordResetRequestAction(request.id, tempPass);
    if (result?.error) {
      setError(result.error);
    } else {
      setGeneratedTempPassword(tempPass);
      setReissueTargetEmail(request.email);
      setShowReissueModal(true);
      fetchData();
    }
  };

  // Filters
  const filteredStudents = profiles.filter(p => {
    if (p.role !== 'student') return false;
    const enroll = enrollments.find(e => e.student_id === p.id);
    const className = enroll?.classes?.name || 'Unassigned';
    
    // Find parent details
    const pLink = parentLinks.find(link => link.student_id === p.id);
    const parentProfile = pLink ? profiles.find(pr => pr.id === pLink.parent_id) : null;
    const parentName = parentProfile ? `${parentProfile.first_name} ${parentProfile.last_name}` : 'N/A';

    const term = searchQuery.toLowerCase();
    return (
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
      (p.admission_no && p.admission_no.toLowerCase().includes(term)) ||
      className.toLowerCase().includes(term) ||
      parentName.toLowerCase().includes(term)
    );
  });

  const filteredTeachers = profiles.filter(p => {
    if (p.role !== 'teacher') return false;
    const meta = teachers.find(t => t.id === p.id);
    const spec = meta?.specialization || '';
    const qual = meta?.qualification || '';

    const term = searchQuery.toLowerCase();
    return (
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      spec.toLowerCase().includes(term) ||
      qual.toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Tenant Records & Registry</h1>
          <p>Hire staff, sync academic qualifications, map parent linkages, and promote student classrooms.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'students' && (
            <button className="btn btn-primary" onClick={() => setShowStudentModal(true)}>
              <UserPlus size={16} /> Register Student
            </button>
          )}
          {activeTab === 'teachers' && (
            <button className="btn btn-primary" onClick={() => setShowTeacherModal(true)}>
              <UserPlus size={16} /> Hire Staff
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav" style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => { setActiveTab('students'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
        >
          <GraduationCap size={16} /> Students ({profiles.filter(p => p.role === 'student').length})
        </button>
        <button 
          onClick={() => { setActiveTab('teachers'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
        >
          <Users size={16} /> Teachers ({profiles.filter(p => p.role === 'teacher').length})
        </button>
        <button 
          onClick={() => { setActiveTab('promotions'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
        >
          <UserCheck size={16} /> Session Promotions
        </button>
        <button 
          onClick={() => { setActiveTab('resets'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'resets' ? 'active' : ''}`}
        >
          <Key size={16} /> Password Resets
          {resetRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="badge badge-danger" style={{ marginLeft: '0.25rem', fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
              {resetRequests.filter(r => r.status === 'pending').length} new
            </span>
          )}
        </button>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'hsl(var(--muted-foreground))' }} size={16} />
              <input 
                className="input" 
                style={{ paddingLeft: '2.25rem', margin: 0 }}
                placeholder="Search student name, admission no, class, or parent name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="animate-spin" /> Fetching student registry...
              </div>
            ) : filteredStudents.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Class Section</th>
                    <th>Parent / Contact Details</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const enroll = enrollments.find(e => e.student_id === student.id);
                    const className = enroll?.classes?.name || 'Unassigned';

                    // Parent resolving
                    const pLink = parentLinks.find(link => link.student_id === student.id);
                    const parentProfile = pLink ? profiles.find(pr => pr.id === pLink.parent_id) : null;

                    return (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 700 }}>{student.admission_no || 'N/A'}</td>
                        <td>
                          <div style={{ fontWeight: 650 }}>{student.first_name} {student.last_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{student.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${enroll?.class_id ? 'badge-primary' : 'badge-secondary'}`}>
                            {className}
                          </span>
                        </td>
                        <td>
                          {parentProfile ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{parentProfile.first_name} {parentProfile.last_name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Phone size={10} /> {parentProfile.phone || 'No phone'}
                                </span>
                                <span>|</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Mail size={10} /> {parentProfile.email}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>No linked parent</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-ghost" 
                            style={{ color: 'hsl(var(--destructive))', padding: '0.3rem' }}
                            onClick={() => handleDeleteUser(student.id, `${student.first_name} ${student.last_name}`)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No student profiles found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHERS TAB */}
      {activeTab === 'teachers' && (
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'hsl(var(--muted-foreground))' }} size={16} />
              <input 
                className="input" 
                style={{ paddingLeft: '2.25rem', margin: 0 }}
                placeholder="Search staff name, email, specialization, or qualification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="animate-spin" /> Fetching teacher registry...
              </div>
            ) : filteredTeachers.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Email Account</th>
                    <th>Contact Phone</th>
                    <th>Specialization</th>
                    <th>Qualification</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => {
                    const meta = teachers.find(t => t.id === teacher.id);
                    return (
                      <tr key={teacher.id}>
                        <td><strong style={{ color: 'hsl(var(--foreground))' }}>{teacher.first_name} {teacher.last_name}</strong></td>
                        <td>{teacher.email}</td>
                        <td>{meta?.phone || 'N/A'}</td>
                        <td>
                          {meta?.specialization ? (
                            <span className="badge badge-indigo">{meta.specialization}</span>
                          ) : (
                            <span style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                        <td>{meta?.qualification || 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-ghost" 
                            style={{ color: 'hsl(var(--destructive))', padding: '0.3rem' }}
                            onClick={() => handleDeleteUser(teacher.id, `${teacher.first_name} ${teacher.last_name}`)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No teacher records found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTO-PROMOTIONS TAB */}
      {activeTab === 'promotions' && (
        <div className="card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>Academic Session Transition & Promotions</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
              Bulk promote student class sections. Deselect checkboxes for students who are repeating the session.
            </p>
          </div>

          <form onSubmit={handlePromoteStudents}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Source Class (Promote From)</label>
                <select 
                  className="input" 
                  value={promoSourceClassId} 
                  onChange={(e) => setPromoSourceClassId(e.target.value)}
                  required
                >
                  <option value="">Select source class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Class (Promote To)</label>
                <select 
                  className="input" 
                  value={promoTargetClassId} 
                  onChange={(e) => setPromoTargetClassId(e.target.value)}
                  required
                >
                  <option value="">Select target class...</option>
                  {classes.filter(c => c.id !== promoSourceClassId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="graduate">🎓 Graduate / Archive (Decouple Class Roster)</option>
                </select>
              </div>
            </div>

            {/* Roster Checklist */}
            <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--muted)/0.3)', padding: '0.75rem 1rem', borderBottom: '1px solid hsl(var(--border))' }}>
                <span style={{ fontWeight: 650, fontSize: '0.85rem' }}>Students Enrolled in Source Class</span>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const classStudentIds = enrollments.filter(e => e.class_id === promoSourceClassId).map(e => e.student_id);
                      setSelectedPromoStudentIds(classStudentIds);
                    }}
                    style={{ border: 'none', background: 'none', color: 'hsl(var(--primary))', cursor: 'pointer' }}
                  >
                    Select All
                  </button>
                  <span style={{ color: 'hsl(var(--border))' }}>|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPromoStudentIds([])}
                    style={{ border: 'none', background: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: 'hsl(var(--card))' }}>
                {enrollments.filter(e => e.class_id === promoSourceClassId).length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                    No students currently enrolled in the source class.
                  </div>
                ) : (
                  enrollments
                    .filter(e => e.class_id === promoSourceClassId)
                    .map(enroll => {
                      const stud = profiles.find(p => p.id === enroll.student_id);
                      if (!stud) return null;
                      const isChecked = selectedPromoStudentIds.includes(stud.id);

                      return (
                        <label 
                          key={stud.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid hsl(var(--border)/0.5)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPromoStudentIds(prev => [...prev, stud.id]);
                              } else {
                                setSelectedPromoStudentIds(prev => prev.filter(id => id !== stud.id));
                              }
                            }}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{stud.first_name} {stud.last_name}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{stud.admission_no || 'No Admission No'}</span>
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={promoting || selectedPromoStudentIds.length === 0}
              >
                {promoting ? 'Processing Promotion...' : `Promote Selected (${selectedPromoStudentIds.length})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PASSWORD RESETS TAB */}
      {activeTab === 'resets' && (
        <div className="card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>Password Reset Requests</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
              View and resolve user-submitted password resets. Resolving a request sets a new temporary password on their account.
            </p>
          </div>

          <div className="table-container">
            {resetRequests.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Email Address</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resetRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 650 }}>{req.full_name}</td>
                      <td>{req.email}</td>
                      <td>{new Date(req.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${req.status === 'pending' ? 'badge-danger animate-pulse' : 'badge-success'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'pending' ? (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', height: 'auto' }}
                            onClick={() => handleReissuePassword(req)}
                          >
                            <Key size={12} style={{ marginRight: '0.2rem' }} /> Reissue Password
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'hsl(var(--muted-foreground))' }}>
                            Resolved Code: <code style={{ backgroundColor: 'hsl(var(--muted)/0.5)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>{req.temp_password}</code>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No password reset requests filed yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT REGISTRATION MODAL */}
      {showStudentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card glass-panel" style={{ maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Register New Student</h3>
              <button 
                onClick={() => setShowStudentModal(false)}
                style={{ border: 'none', background: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateStudent}>
              <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--primary))', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>Student Profile</h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="input" name="firstName" placeholder="e.g. John" required disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="input" name="lastName" placeholder="e.g. Doe" required disabled={isPending} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Admission No</label>
                  <input className="input" name="admissionNo" placeholder="e.g. SCH-2026-001" required disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label">Class Roster Room</label>
                  <select className="input" name="classId" required disabled={isPending}>
                    <option value="">Select class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Portal Email (Optional)</label>
                  <input className="input" name="email" type="email" placeholder="e.g. student@school.edu" disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label">Portal Password (Optional)</label>
                  <input className="input" name="password" type="password" placeholder="••••••••" disabled={isPending} />
                </div>
              </div>

              {/* PARENT LINKAGE SECTION */}
              <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--primary))', margin: 0, letterSpacing: '0.5px' }}>Parent Account Linkage</h5>
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'hsl(var(--muted)/0.3)', padding: '0.15rem', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setParentType('new')}
                      style={{ border: 'none', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 650, borderRadius: '4px', cursor: 'pointer', backgroundColor: parentType === 'new' ? 'hsl(var(--primary))' : 'transparent', color: parentType === 'new' ? 'white' : 'hsl(var(--muted-foreground))' }}
                    >
                      New Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentType('existing')}
                      style={{ border: 'none', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 650, borderRadius: '4px', cursor: 'pointer', backgroundColor: parentType === 'existing' ? 'hsl(var(--primary))' : 'transparent', color: parentType === 'existing' ? 'white' : 'hsl(var(--muted-foreground))' }}
                    >
                      Existing Parent
                    </button>
                  </div>
                </div>

                {parentType === 'existing' ? (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Select Existing Parent Profile</label>
                    <select className="input" name="parentId" required disabled={isPending}>
                      <option value="">Choose parent profile...</option>
                      {profiles
                        .filter(p => p.role === 'parent')
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Parent Full Name</label>
                      <input className="input" name="parentName" placeholder="e.g. Alhaji Ibrahim Balogun" required disabled={isPending} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Parent Email Address</label>
                        <input className="input" name="parentEmail" type="email" placeholder="e.g. parent@mail.com" required disabled={isPending} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Parent Portal Password</label>
                        <input className="input" name="parentPassword" type="password" placeholder="••••••••" required disabled={isPending} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">Parent Contact Phone</label>
                      <input className="input" name="parentPhone" placeholder="e.g. +234 803 111 2222" disabled={isPending} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowStudentModal(false)} disabled={isPending}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" size={14} /> : 'Sync & Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER HIRING MODAL */}
      {showTeacherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card glass-panel" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Hire / Register Teacher</h3>
              <button 
                onClick={() => setShowTeacherModal(false)}
                style={{ border: 'none', background: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTeacher}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="input" name="firstName" placeholder="e.g. Folashade" required disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="input" name="lastName" placeholder="e.g. Adebayo" required disabled={isPending} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Portal Email</label>
                  <input className="input" name="email" type="email" placeholder="e.g. teacher.adebayo@school.edu" required disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label">Portal Password</label>
                  <input className="input" name="password" type="password" placeholder="••••••••" required disabled={isPending} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Specialization Area</label>
                  <input className="input" name="specialization" placeholder="e.g. Math & Physics" disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label">Qualification / Degree</label>
                  <input className="input" name="qualification" placeholder="e.g. B.Ed. Math, PGDE" disabled={isPending} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Contact Phone</label>
                <input className="input" name="phone" placeholder="e.g. +234 805 333 4444" disabled={isPending} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTeacherModal(false)} disabled={isPending}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" size={14} /> : 'Save Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REISSUE CONFIRMATION MODAL */}
      {showReissueModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 101, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card glass-panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
            <div className="stat-icon stat-icon-emerald" style={{ width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 1.25rem' }}>
              <BadgeCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Password Reissued</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
              The portal credential for <strong>{reissueTargetEmail}</strong> has been successfully resolved.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'hsl(var(--muted)/0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid hsl(var(--border))', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 650, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Temporary Password</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--primary))', letterSpacing: '1px', selectAll: 'true' }}>
                {generatedTempPassword}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setShowReissueModal(false)}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
