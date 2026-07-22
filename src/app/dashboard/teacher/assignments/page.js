'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  Trash2, 
  X, 
  ClipboardList, 
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  createAssignmentAction, 
  deleteAssignmentAction, 
  gradeSubmissionAction 
} from '@/app/actions';

export default function TeacherAssignmentsPage() {
  const supabase = createClient();
  const [allocations, setAllocations] = useState([]);
  const [selectedCsId, setSelectedCsId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status states
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);

  // Form States - Create Assignment
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Form States - Grading Side-by-Side
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('A');
  const [feedbackText, setFeedbackText] = useState('');
  const [grading, setGrading] = useState(false);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch class subjects assigned to teacher
      const { data: csList } = await supabase
        .from('class_subjects')
        .select('*, classes(name), subjects(name, code)')
        .eq('teacher_id', user.id);

      // 2. Fetch profiles of students
      const { data: stdList } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      // 3. Fetch enrollments
      const { data: enrolls } = await supabase.from('enrollments').select('*');

      if (csList) {
        setAllocations(csList);
        if (csList.length > 0) setSelectedCsId(csList[0].id);
      }
      if (stdList) setStudents(stdList);
      if (enrolls) setEnrollments(enrolls);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadAssignments = async () => {
    if (!selectedCsId) return;
    try {
      const { data: assignList } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_subject_id', selectedCsId)
        .order('created_at', { ascending: false });

      if (assignList) {
        // Fetch submission counts
        const { data: subms } = await supabase.from('submissions').select('id, assignment_id');
        const enriched = assignList.map(a => {
          const count = subms ? subms.filter(s => s.assignment_id === a.id).length : 0;
          return { ...a, submissionCount: count };
        });
        setAssignments(enriched);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [selectedCsId]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDueDate || !selectedCsId) return;
    setCreating(true);
    setError(''); setSuccess('');

    const res = await createAssignmentAction(selectedCsId, newTitle.trim(), newDescription.trim(), new Date(newDueDate).toISOString());
    setCreating(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Assignment published to class registry!');
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setCreateModalOpen(false);
      loadAssignments();
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment and all associated student submissions?')) return;
    setError(''); setSuccess('');
    const res = await deleteAssignmentAction(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Assignment deleted successfully.');
      loadAssignments();
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    setActiveAssignment(assignment);
    setSubmissionsModalOpen(true);
    setSelectedSubmission(null);
    setFeedbackText('');
    setGradeValue('A');
    try {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('submitted_at', { ascending: false });
      setSubmissions(subs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSubmission = (sub) => {
    setSelectedSubmission(sub);
    setGradeValue(sub.grade || 'A');
    setFeedbackText(sub.feedback || '');
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setGrading(true);
    setError(''); setSuccess('');

    const res = await gradeSubmissionAction(selectedSubmission.id, gradeValue, feedbackText.trim());
    setGrading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Coursework graded successfully!');
      
      // Refresh submissions list
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', activeAssignment.id)
        .order('submitted_at', { ascending: false });
      setSubmissions(subs || []);
      
      // Clear selection
      setSelectedSubmission(null);
      loadAssignments(); // update count
    }
  };

  const getStudentName = (studentId) => {
    const std = students.find(s => s.id === studentId);
    return std ? `${std.first_name} ${std.last_name}` : 'Unknown Student';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1>Assignments Workspace</h1>
          <p>Configure classroom coursework, collect attachments, and grade homework sheets.</p>
        </div>
        {allocations.length > 0 && (
          <button 
            className="btn btn-primary" 
            onClick={() => { setSuccess(''); setError(''); setCreateModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Plus size={16} /> Create Assignment
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Class Subject Filter */}
      <div className="card glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ margin: 0, maxWidth: '400px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>Select Class Subject</label>
          {allocations.length === 0 ? (
            <p style={{ color: 'hsl(var(--destructive))', fontWeight: 600, fontSize: '0.85rem' }}>
              You are not assigned as an instructor for any courses in the curriculum.
            </p>
          ) : (
            <select 
              className="input" 
              value={selectedCsId} 
              onChange={(e) => { setSelectedCsId(e.target.value); setError(''); setSuccess(''); }}
              style={{ padding: '0.4rem 0.75rem' }}
            >
              {allocations.map(a => (
                <option key={a.id} value={a.id}>{a.classes?.name} — {a.subjects?.name} ({a.subjects?.code})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Assignments List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Published Coursework</h3>
        </div>

        {loading ? (
          <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Loading assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--border)' }}>
            {assignments.map(assign => (
              <div key={assign.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'hsl(var(--primary))' }}>{assign.title}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, margin: '0.25rem 0' }}>{assign.description}</p>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} /> Due: {new Date(assign.due_date).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} /> {assign.submissionCount} Submissions
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    onClick={() => handleOpenSubmissions(assign)}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <ClipboardList size={14} /> Submissions
                  </button>
                  <button 
                    onClick={() => handleDeleteAssignment(assign.id)}
                    style={{ background: 'none', border: 'none', color: 'hsl(var(--destructive))', cursor: 'pointer', padding: '0.5rem' }}
                    title="Delete Coursework"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <div className="empty-state-icon">
              <BookOpen size={24} />
            </div>
            <p>No coursework assignments created for this class subject. Click "Create Assignment" to assign tasks.</p>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <form className="card" onSubmit={handleCreateAssignment} style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Create New Coursework Task</h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Assignment Title</label>
              <input className="input" placeholder="e.g. Quadric Equations Homework" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Instructions / Description</label>
              <textarea className="input" rows={4} placeholder="Type detailed instructions here..." value={newDescription} onChange={e => setNewDescription(e.target.value)} required style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Due Date & Time</label>
              <input type="datetime-local" className="input" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
              {creating ? 'Creating Assignment...' : 'Publish Coursework'}
            </button>
          </form>
        </div>
      )}

      {/* Submissions Grading Modal (Side-by-Side Panel) */}
      {submissionsModalOpen && activeAssignment && (
        <div className="modal-backdrop">
          <div className="card" style={{ maxWidth: selectedSubmission ? '1100px' : '750px', width: '100%', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Coursework Submissions: {activeAssignment.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.2rem' }}>Review student solution sheets and enter scores.</p>
              </div>
              <button type="button" onClick={() => setSubmissionsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            {/* Side-by-side or simple list grid */}
            <div className={selectedSubmission ? 'split-layout-3-2-rev' : ''} style={{ display: selectedSubmission ? undefined : 'grid', gridTemplateColumns: selectedSubmission ? undefined : '1fr', gap: '1.5rem', flex: 1, overflow: 'auto' }}>
              {/* Left Panel: Submissions list or submission content */}
              <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {selectedSubmission ? (
                  /* Preview Student Submission */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setSelectedSubmission(null)}>
                        ← Back to Roster
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 750 }}>
                        Student: {getStudentName(selectedSubmission.student_id)}
                      </span>
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Solution Text Response</h4>
                      <pre style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {selectedSubmission.submission_text || 'No text derivation submitted.'}
                      </pre>
                    </div>

                    {selectedSubmission.file_url && (
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <div style={{ padding: '0.5rem 1rem', backgroundColor: 'hsl(var(--muted) / 0.25)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Inline PDF / Image Previewer</span>
                          <a href={selectedSubmission.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ExternalLink size={12} /> Open link
                          </a>
                        </div>
                        {selectedSubmission.file_url.match(/\.(jpeg|jpg|png|gif|webp)/i) || selectedSubmission.file_url.startsWith('data:image/') ? (
                          <img src={selectedSubmission.file_url} alt="Student Math Sheet Upload" loading="lazy" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', backgroundColor: '#1a1a1a', display: 'block' }} />
                        ) : (
                          <iframe src={selectedSubmission.file_url} width="100%" height="400px" style={{ border: 'none' }} />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Student Submissions Roster List */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="table-container">
                      <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Handed In</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.length > 0 ? (
                          submissions.map(sub => (
                            <tr key={sub.id}>
                              <td style={{ fontWeight: 650 }}>{getStudentName(sub.student_id)}</td>
                              <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                              <td>
                                <span className={sub.status === 'graded' ? 'badge badge-primary' : 'badge badge-secondary'} style={{ fontSize: '0.75rem', backgroundColor: sub.status === 'graded' ? 'var(--success)' : '', color: sub.status === 'graded' ? 'white' : '' }}>
                                  {sub.status === 'graded' ? `Graded: ${sub.grade}` : 'Submitted'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.3rem 0.85rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                                  onClick={() => handleSelectSubmission(sub)}
                                >
                                  {sub.status === 'graded' ? 'Review & Regrade' : 'Grade Submission'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No student has submitted solutions for this assignment yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Side-by-side active grading controls */}
              {selectedSubmission && (
                <form onSubmit={handleToggleElective} style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Evaluation Remarks</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Academic Grade scale</label>
                    <select className="input" value={gradeValue} onChange={e => setGradeValue(e.target.value)}>
                      <option value="A">Grade A (Excellent)</option>
                      <option value="B">Grade B (Very Good)</option>
                      <option value="C">Grade C (Good)</option>
                      <option value="D">Grade D (Pass)</option>
                      <option value="E">Grade E (Poor)</option>
                      <option value="F">Grade F (Fail)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Feedback Remarks</label>
                    <textarea 
                      className="input" 
                      rows={5} 
                      value={feedbackText} 
                      onChange={e => setFeedbackText(e.target.value)} 
                      placeholder="Provide academic notes..."
                      required
                      style={{ resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 'auto' }}
                    onClick={handleGradeSubmission}
                    disabled={grading}
                  >
                    {grading ? 'Submitting marks...' : 'Publish Evaluation'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
