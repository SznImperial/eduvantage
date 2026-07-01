'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  Award, 
  X, 
  Send, 
  AlertCircle 
} from 'lucide-react';
import { submitAssignmentAction } from '@/app/actions';

export default function StudentAssignmentsPage() {
  const supabase = createClient();
  const [displayAssignments, setDisplayAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');

  // Submit Modal States
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);

  // View Grade Modal States
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeAssignmentTitle, setActiveAssignmentTitle] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // 1. Get student profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setStudentId(user.id);

      // 2. Find enrollment to know class_id
      const { data: enroll } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (enroll) {
        // 3. Fetch class subjects mapped to this class
        const { data: classSubs } = await supabase
          .from('class_subjects')
          .select('*, subjects(name, code)')
          .eq('class_id', enroll.class_id);

        if (classSubs && classSubs.length > 0) {
          const classSubIds = classSubs.map(cs => cs.id);

          // 4. Fetch assignments
          const { data: assignList } = await supabase
            .from('assignments')
            .select('*')
            .in('class_subject_id', classSubIds)
            .order('due_date', { ascending: true });

          // 5. Fetch submissions
          const { data: subms } = await supabase
            .from('submissions')
            .select('*')
            .eq('student_id', user.id);

          if (assignList) {
            const mapped = assignList.map(a => {
              const cs = classSubs.find(x => x.id === a.class_subject_id);
              const sub = subms ? subms.find(s => s.assignment_id === a.id) : null;
              return {
                assignment: a,
                subjectName: cs?.subjects?.name || 'Unknown Course',
                subjectCode: cs?.subjects?.code || '',
                submission: sub
              };
            });
            setDisplayAssignments(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load assignments list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText('');
    setAttachmentFile(null);
    setSubmitModalOpen(true);
    setError(''); setSuccess('');
  };

  const handleOpenGrade = (title, sub) => {
    setActiveAssignmentTitle(title);
    setActiveSubmission(sub);
    setGradeModalOpen(true);
  };

  const handleHandIn = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !studentId || (!submissionText.trim() && !attachmentFile)) return;
    setSubmitting(true);
    setError(''); setSuccess('');

    try {
      let fileUrl = '';
      if (attachmentFile) {
        // Upload file to Supabase storage bucket 'submissions'
        const cleanName = `${studentId}/${selectedAssignment.id}/${Date.now()}_${attachmentFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(cleanName, attachmentFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadErr) {
          throw new Error(`Storage upload failed: ${uploadErr.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(cleanName);
        fileUrl = publicUrl;
      }

      // Call server action to write record
      const res = await submitAssignmentAction(
        selectedAssignment.id,
        submissionText.trim(),
        fileUrl || null
      );

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Assignment uploaded and marked as submitted!');
        setTimeout(() => {
          setSubmitModalOpen(false);
          setSelectedAssignment(null);
          setSubmissionText('');
          setAttachmentFile(null);
          loadStudentData();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTasks = displayAssignments.filter(d => !d.submission || d.submission.status !== 'graded');
  const gradedTasks = displayAssignments.filter(d => d.submission && d.submission.status === 'graded');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Assignments Inbox</h1>
        <p>Review active homework tasks, hand in derivations, and check evaluations grades.</p>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
            <p>Loading your assignments queue...</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* A. Pending Assignments */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Pending & Active Tasks</h3>
            </div>

            {pendingTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pendingTasks.map(({ assignment, subjectName, subjectCode, submission }) => (
                  <div key={assignment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'hsl(var(--primary))' }}>{assignment.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                        Course: {subjectName} ({subjectCode})
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: '0.25rem 0' }}>{assignment.description}</p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={13} /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                        {submission ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)' }}>
                            <Clock size={13} /> Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--destructive))' }}>
                            <AlertCircle size={13} /> Unsubmitted
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleOpenSubmit(assignment)} 
                      className={submission ? 'btn btn-outline' : 'btn btn-primary'}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      {submission ? 'Resubmit Solution' : 'Submit Solution'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle size={24} />
                </div>
                <p>Hooray! No pending homework tasks left in your queue.</p>
              </div>
            )}
          </div>

          {/* B. Graded Assignments */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Graded & Evaluated Task Sheets</h3>
            </div>

            {gradedTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {gradedTasks.map(({ assignment, subjectName, subjectCode, submission }) => (
                  <div key={assignment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'hsl(var(--primary))' }}>{assignment.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                        Course: {subjectName} ({subjectCode})
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: '0.25rem 0' }}>{assignment.description}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="badge badge-primary" style={{ backgroundColor: 'var(--success)', color: 'white', fontWeight: 700 }}>
                          Grade: {submission.grade}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleOpenGrade(assignment.title, submission)} 
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Award size={14} /> View Feedback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No graded coursework tasks on record yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hand In Solution Modal */}
      {submitModalOpen && selectedAssignment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <form className="card" onSubmit={handleHandIn} style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Hand In Solution: {selectedAssignment.title}</h3>
              <button type="button" onClick={() => setSubmitModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <CheckCircle2 size={14} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Derivation Text / Answers Response</label>
              <textarea 
                className="input" 
                rows={5} 
                value={submissionText} 
                onChange={e => setSubmissionText(e.target.value)} 
                placeholder="Type your notes or solution derivations here..."
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Upload Solution Sheet (Image/PDF)</label>
              <input 
                type="file" 
                className="input" 
                onChange={e => setAttachmentFile(e.target.files[0])} 
                accept="image/*,application/pdf"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              <Send size={16} /> {submitting ? 'Uploading sheets...' : 'Send to Instructor'}
            </button>
          </form>
        </div>
      )}

      {/* View Evaluation Feedback Modal */}
      {gradeModalOpen && activeSubmission && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Instructor Grade: {activeAssignmentTitle}</h3>
              <button type="button" onClick={() => setGradeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--success) / 0.15)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 650, fontSize: '0.9rem' }}>Evaluation Score</span>
                <span className="badge badge-primary" style={{ backgroundColor: 'var(--success)', color: 'white', fontSize: '1rem', padding: '0.5rem 1rem', fontWeight: 800 }}>
                  Grade {activeSubmission.grade}
                </span>
              </div>

              <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
                <h4 style={{ fontWeight: 750, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Teacher Feedback Remarks</h4>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5, color: 'hsl(var(--primary))' }}>
                  "{activeSubmission.feedback || 'No comments left by instructor.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
