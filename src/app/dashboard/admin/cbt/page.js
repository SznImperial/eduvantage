'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  FileCheck, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { 
  updateCbtExamStatusAction, 
  releaseCbtResultsAction, 
  withholdCbtResultsAction 
} from '@/app/actions';

export default function AdminCbtPage() {
  const supabase = createClient();
  const [exams, setExams] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Tabs: 'approvals' | 'results'
  const [activeTab, setActiveTab] = useState('approvals');

  // Preview Modal States
  const [selectedExam, setSelectedExam] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Submissions Modal States
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedExamSubmissions, setSelectedExamSubmissions] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch exams
      const { data: examsList } = await supabase
        .from('cbt_exams')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });

      // 2. Fetch class subjects details
      const { data: csList } = await supabase
        .from('class_subjects')
        .select('id, classes(name), subjects(name, code)');

      // 3. Fetch submissions
      const { data: submsList } = await supabase
        .from('cbt_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      // 4. Fetch student profiles
      const { data: stdList } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (examsList) setExams(examsList);
      if (csList) setClassSubjects(csList);
      if (submsList) setSubmissions(submsList);
      if (stdList) setStudents(stdList);
    } catch (err) {
      console.error('Failed to load CBT data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAuditQuestions = async (exam) => {
    setSelectedExam(exam);
    setShowPreviewModal(true);
    setLoadingQuestions(true);
    try {
      const { data: questions } = await supabase
        .from('cbt_questions')
        .select('*')
        .eq('exam_id', exam.id);
      setPreviewQuestions(questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleApproveExam = async (examId) => {
    setError(''); setSuccess('');
    const res = await updateCbtExamStatusAction(examId, 'approved');
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('CBT Exam approved and released to student portal.');
      setShowPreviewModal(false);
      loadData();
    }
  };

  const handleRejectExam = async (examId) => {
    setError(''); setSuccess('');
    const res = await updateCbtExamStatusAction(examId, 'rejected');
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('CBT Exam rejected and sent back to draft mode.');
      setShowPreviewModal(false);
      loadData();
    }
  };

  const handleViewSubmissions = (exam) => {
    const examSubs = submissions.filter(s => s.exam_id === exam.id);
    setSelectedExamSubmissions(examSubs);
    setSelectedExam(exam);
    setShowSubmissionsModal(true);
  };

  const handleReleaseAllResults = async (examId) => {
    setError(''); setSuccess('');
    const res = await releaseCbtResultsAction(examId);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('All scores for this exam have been released to student dashboards.');
      loadData();
      setShowSubmissionsModal(false);
    }
  };

  const handleWithholdAllResults = async (examId) => {
    setError(''); setSuccess('');
    const res = await withholdCbtResultsAction(examId);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('All scores for this exam have been withheld.');
      loadData();
      setShowSubmissionsModal(false);
    }
  };

  const getClassSubjectLabel = (csId) => {
    const cs = classSubjects.find(x => x.id === csId);
    if (!cs) return 'Unknown Course';
    return `${cs.classes?.name} — ${cs.subjects?.name} (${cs.subjects?.code})`;
  };

  const pendingExams = exams.filter(e => e.status === 'pending_approval');
  const auditedExams = exams.filter(e => e.status === 'approved' || e.status === 'rejected');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Computer-Based Testing (CBT) Auditing</h1>
        <p>Review draft questions set by teachers, authorize exams, inspect proctoring reports, and release scores.</p>
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

      {/* Tabs */}
      <div className="tab-nav">
        <button 
          onClick={() => { setActiveTab('approvals'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
        >
          <Clock size={16} /> Awaiting Approval ({pendingExams.length})
        </button>
        <button 
          onClick={() => { setActiveTab('results'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
        >
          <Award size={16} /> Active & Completed Exams ({exams.filter(e => e.status === 'approved').length})
        </button>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Loading CBT registry...</p>
          </div>
        </div>
      ) : activeTab === 'approvals' ? (
        <div className="card">
          <div className="table-container">
            {pendingExams.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Exam Details</th>
                    <th>Class & Subject</th>
                    <th>Created By</th>
                    <th style={{ textAlign: 'center' }}>Duration</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingExams.map((exam) => (
                    <tr key={exam.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>{exam.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.2rem' }}>
                          Submitted: {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{getClassSubjectLabel(exam.class_subject_id)}</td>
                      <td>{exam.profiles?.first_name} {exam.profiles?.last_name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{exam.duration_minutes} Mins</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleAuditQuestions(exam)} 
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          <Eye size={14} /> Audit Questions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileCheck size={24} />
                </div>
                <p>No exams currently awaiting authorization in the queue.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            {exams.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Class & Subject</th>
                    <th style={{ textAlign: 'center' }}>Submissions</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Audit Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => {
                    const examSubs = submissions.filter(s => s.exam_id === exam.id);
                    const isAnyReleased = examSubs.some(s => s.status === 'released');
                    return (
                      <tr key={exam.id}>
                        <td>
                          <strong style={{ fontSize: '0.95rem' }}>{exam.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.2rem' }}>
                            Created: {new Date(exam.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{getClassSubjectLabel(exam.class_subject_id)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            {examSubs.length} Submissions
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {exam.status === 'rejected' ? (
                            <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>Rejected</span>
                          ) : exam.status === 'draft' ? (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Draft</span>
                          ) : isAnyReleased ? (
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem', backgroundColor: 'var(--success)', color: 'white' }}>Scores Released</span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Awaiting Release</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleViewSubmissions(exam)} 
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                          >
                            <CheckSquare size={14} /> Audit Submissions
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>No active exams recorded in the curriculum database.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Questions Modal */}
      {showPreviewModal && selectedExam && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Audit Questions: {selectedExam.title}</h3>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
              {loadingQuestions ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>Loading questionnaire...</p>
              ) : previewQuestions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No questions configured for this exam draft.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {previewQuestions.map((q, idx) => (
                    <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Question {idx + 1}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Correct Key: {q.correct_option}</span>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>{q.question_text}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                        <div><strong>A.</strong> {q.option_a}</div>
                        <div><strong>B.</strong> {q.option_b}</div>
                        <div><strong>C.</strong> {q.option_c}</div>
                        <div><strong>D.</strong> {q.option_d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => handleRejectExam(selectedExam.id)} className="btn btn-outline" style={{ borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))' }}>
                <XCircle size={15} /> Reject draft
              </button>
              <button onClick={() => handleApproveExam(selectedExam.id)} className="btn btn-primary">
                <CheckCircle2 size={15} /> Approve & Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Submissions Modal */}
      {showSubmissionsModal && selectedExam && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="card" style={{ maxWidth: '850px', width: '100%', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Audit Student Submissions: {selectedExam.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.2rem' }}>Review student scores and check proctoring integrity indicators.</p>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', marginBottom: '1.5rem' }}>
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th style={{ textAlign: 'center' }}>Score Obtained</th>
                    <th style={{ textAlign: 'center' }}>Integrity Logs</th>
                    <th style={{ textAlign: 'center' }}>Proctoring status</th>
                    <th style={{ textAlign: 'center' }}>Release status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExamSubmissions.length > 0 ? (
                    selectedExamSubmissions.map(sub => {
                      const std = students.find(s => s.id === sub.student_id);
                      const percentage = sub.total_questions > 0 ? ((sub.score / sub.total_questions) * 100).toFixed(0) : 0;
                      return (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 650 }}>{std ? `${std.first_name} ${std.last_name}` : 'Unknown Student'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            {sub.score} / {sub.total_questions} ({percentage}%)
                          </td>
                          <td style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                            Tab Switches: <strong>{sub.tab_switch_count}</strong> | Noise Spikes: <strong>{sub.noise_spike_count}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {sub.proctor_violated ? (
                              <span className="badge badge-error" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <ShieldAlert size={12} /> Lockout Violated
                              </span>
                            ) : sub.tab_switch_count > 0 || sub.noise_spike_count > 5 ? (
                              <span className="badge badge-error" style={{ fontSize: '0.7rem', backgroundColor: 'var(--warning)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <AlertTriangle size={12} /> Integrity Warning
                              </span>
                            ) : (
                              <span className="badge badge-primary" style={{ fontSize: '0.7rem', backgroundColor: 'var(--success)', color: 'white' }}>Passed</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {sub.status === 'released' ? (
                              <span className="badge badge-primary" style={{ fontSize: '0.7rem', backgroundColor: 'var(--success)', color: 'white' }}>Released</span>
                            ) : sub.status === 'withheld' ? (
                              <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>Withheld</span>
                            ) : (
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Awaiting Release</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No student has submitted answers for this exam yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => handleWithholdAllResults(selectedExam.id)} className="btn btn-outline" style={{ borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))' }}>
                Withhold All
              </button>
              <button onClick={() => handleReleaseAllResults(selectedExam.id)} className="btn btn-primary">
                Release All Scores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
