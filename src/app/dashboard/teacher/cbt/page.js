'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  Plus, 
  Trash2, 
  ClipboardList, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  Eye, 
  Award, 
  AlertTriangle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { 
  createCbtExamAction, 
  deleteCbtExamAction 
} from '@/app/actions';

export default function TeacherCbtPage() {
  const supabase = createClient();
  const [exams, setExams] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status indicators
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Active Tab: 'exams' | 'results'
  const [activeTab, setActiveTab] = useState('exams');

  // Authoring Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [selectedCsId, setSelectedCsId] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
  ]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Results View State
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewQuestionsModal, setViewQuestionsModal] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch class subjects assigned to teacher
      const { data: csList } = await supabase
        .from('class_subjects')
        .select('*, classes(name), subjects(name, code)')
        .eq('teacher_id', user.id);

      // 2. Fetch CBT exams created by this teacher
      const { data: examsList } = await supabase
        .from('cbt_exams')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // 3. Fetch submissions
      const { data: submsList } = await supabase.from('cbt_submissions').select('*');

      // 4. Fetch student profiles
      const { data: stdList } = await supabase.from('profiles').select('*').eq('role', 'student');

      if (csList) {
        setClassSubjects(csList);
        if (csList.length > 0) setSelectedCsId(csList[0].id);
      }
      if (examsList) setExams(examsList);
      if (submsList) setSubmissions(submsList);
      if (stdList) setStudents(stdList);

    } catch (err) {
      console.error('Failed to load CBT registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddQuestion = () => {
    const newQs = [
      ...questions,
      { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
    ];
    setQuestions(newQs);
    setActiveQuestionIdx(newQs.length - 1);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) return;
    const newQs = questions.filter((_, i) => i !== idx);
    setQuestions(newQs);
    if (activeQuestionIdx >= newQs.length) {
      setActiveQuestionIdx(newQs.length - 1);
    }
  };

  const handleQuestionChange = (idx, field, val) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  const handleCreateCbtExam = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!examTitle.trim() || !selectedCsId || duration <= 0) {
      setError('Please fill in all general exam details.');
      return;
    }

    // Verify all questions have content
    const invalid = questions.some(
      q => !q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()
    );
    if (invalid) {
      setError('All questions must have question texts and all A-D options filled out.');
      return;
    }

    setSaving(true);
    const res = await createCbtExamAction(
      examTitle.trim(),
      selectedCsId,
      duration,
      questions
    );
    setSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('CBT Exam drafted and submitted to administration for auditing.');
      // Reset Form
      setExamTitle('');
      setDuration(30);
      setQuestions([{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }]);
      setActiveQuestionIdx(0);
      setShowCreateModal(false);
      loadData();
    }
  };

  const handleDeleteExam = async (id) => {
    if (!confirm('Are you sure you want to delete this exam and all its associated submissions?')) return;
    setError(''); setSuccess('');
    const res = await deleteCbtExamAction(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('CBT Exam deleted.');
      loadData();
    }
  };

  const handleViewQuestions = async (exam) => {
    setSelectedExam(exam);
    setViewQuestionsModal(true);
    setLoadingQuestions(true);
    try {
      const { data } = await supabase
        .from('cbt_questions')
        .select('*')
        .eq('exam_id', exam.id);
      setExamQuestions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const getClassSubjectLabel = (csId) => {
    const cs = classSubjects.find(x => x.id === csId);
    if (!cs) return 'Unknown';
    return `${cs.classes?.name} — ${cs.subjects?.name}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', style: 'badge badge-primary', bg: 'var(--success)' };
      case 'pending_approval':
        return { label: 'Pending Audit', style: 'badge badge-warning', bg: 'var(--warning)' };
      case 'rejected':
        return { label: 'Rejected', style: 'badge badge-error', bg: '' };
      default:
        return { label: 'Draft', style: 'badge badge-secondary', bg: '' };
    }
  };

  const isQComplete = (q) => {
    return !!(q.question_text.trim() && q.option_a.trim() && q.option_b.trim() && q.option_c.trim() && q.option_d.trim());
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1>Computer-Based Testing (CBT)</h1>
          <p>Create online multiple-choice quizzes, set time limits, and review student grades.</p>
        </div>
        {classSubjects.length > 0 && activeTab === 'exams' && (
          <button 
            className="btn btn-primary" 
            onClick={() => { setSuccess(''); setError(''); setShowCreateModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Plus size={16} /> Create CBT Exam
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

      {/* Tab Controls */}
      <div className="tab-nav" style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => { setActiveTab('exams'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
        >
          <ClipboardList size={16} /> My Exams
        </button>
        <button 
          onClick={() => { setActiveTab('results'); setError(''); setSuccess(''); }} 
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
        >
          <Award size={16} /> Exam Results
        </button>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Loading CBT records...</p>
          </div>
        </div>
      ) : classSubjects.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <div className="empty-state-icon">
              <AlertCircle size={24} />
            </div>
            <p>You are not currently assigned to teach any classes. Please contact the administrator.</p>
          </div>
        </div>
      ) : activeTab === 'exams' ? (
        /* Exams Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem' }}>
          {exams.length > 0 ? (
            exams.map(exam => {
              const badge = getStatusBadge(exam.status);
              return (
                <div key={exam.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={badge.style} style={{ fontSize: '0.7rem', backgroundColor: badge.bg, color: badge.bg ? 'white' : '' }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {exam.duration_minutes} Mins
                      </span>
                    </div>
                    <strong style={{ fontSize: '1.05rem', color: 'hsl(var(--primary))', marginTop: '0.25rem' }}>{exam.title}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                      Class: {getClassSubjectLabel(exam.class_subject_id)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => handleViewQuestions(exam)} 
                      className="btn btn-outline" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Eye size={13} /> View Questions
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--destructive))', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete Exam"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                <div className="empty-state-icon">
                  <ClipboardList size={24} />
                </div>
                <p>No CBT exams created yet. Click "Create CBT Exam" to start authoring.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results Table Tab */
        <div className="card">
          <div className="table-container">
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Class & Subject</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th style={{ textAlign: 'center' }}>Proctoring status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(exam => {
                  const examSubs = submissions.filter(s => s.exam_id === exam.id);
                  if (examSubs.length === 0) return null;
                  return examSubs.map(sub => {
                    const std = students.find(s => s.id === sub.student_id);
                    const percentage = sub.total_questions > 0 ? ((sub.score / sub.total_questions) * 100).toFixed(0) : 0;
                    return (
                      <tr key={sub.id}>
                        <td><strong>{exam.title}</strong></td>
                        <td>{getClassSubjectLabel(exam.class_subject_id)}</td>
                        <td style={{ fontWeight: 650 }}>{std ? `${std.first_name} ${std.last_name}` : 'Unknown Student'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{sub.score} / {sub.total_questions} ({percentage}%)</td>
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
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem', backgroundColor: 'var(--success)', color: 'white' }}>Integrity Passed</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No student CBT submission scores recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create CBT Exam Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <form className="card modal-sheet" onSubmit={handleCreateCbtExam} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Author CBT Online Quiz</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} aria-label="Close">✕</button>
            </div>

            <div className="split-layout-3-2-rev" style={{ flex: 1, overflow: 'auto' }}>
              {/* Left Side: Active Question Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Question {activeQuestionIdx + 1} of {questions.length}</h4>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => handleRemoveQuestion(activeQuestionIdx)} style={{ background: 'none', border: 'none', color: 'hsl(var(--destructive))', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 650 }}>
                      Remove Question
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    value={questions[activeQuestionIdx].question_text} 
                    onChange={e => handleQuestionChange(activeQuestionIdx, 'question_text', e.target.value)} 
                    placeholder="Type question content here..."
                    required
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Option A</label>
                    <input className="input" value={questions[activeQuestionIdx].option_a} onChange={e => handleQuestionChange(activeQuestionIdx, 'option_a', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option B</label>
                    <input className="input" value={questions[activeQuestionIdx].option_b} onChange={e => handleQuestionChange(activeQuestionIdx, 'option_b', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option C</label>
                    <input className="input" value={questions[activeQuestionIdx].option_c} onChange={e => handleQuestionChange(activeQuestionIdx, 'option_c', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option D</label>
                    <input className="input" value={questions[activeQuestionIdx].option_d} onChange={e => handleQuestionChange(activeQuestionIdx, 'option_d', e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correct Option Key</label>
                  <select className="input" value={questions[activeQuestionIdx].correct_option} onChange={e => handleQuestionChange(activeQuestionIdx, 'correct_option', e.target.value)}>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
              </div>

              {/* Right Side: General details & Question selector index */}
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Quiz Details</h4>
                <div className="form-group">
                  <label className="form-label">Exam Title</label>
                  <input className="input" placeholder="e.g. Algebra Midterm Test" value={examTitle} onChange={e => setExamTitle(e.target.value)} required style={{ padding: '0.4rem 0.75rem' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Subject</label>
                  <select className="input" value={selectedCsId} onChange={e => setSelectedCsId(e.target.value)} required style={{ padding: '0.4rem 0.75rem' }}>
                    {classSubjects.map(cs => (
                      <option key={cs.id} value={cs.id}>{cs.classes?.name} — {cs.subjects?.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input type="number" className="input" value={duration} onChange={e => setDuration(e.target.value)} required style={{ padding: '0.4rem 0.75rem' }} />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Questions Checklist</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
                    {questions.map((q, idx) => {
                      const complete = isQComplete(q);
                      const active = idx === activeQuestionIdx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveQuestionIdx(idx)}
                          className={active ? 'btn btn-primary' : 'btn btn-outline'}
                          style={{
                            padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)',
                            borderColor: !complete ? 'hsl(var(--destructive) / 0.5)' : '',
                            color: !complete && !active ? 'hsl(var(--destructive))' : ''
                          }}
                        >
                          Q{idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }} onClick={handleAddQuestion}>
                    + Append Question
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => handleSubmitExam('draft')} className="btn btn-outline" disabled={saving}>
                Save as Draft
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving Exam...' : 'Submit for Admin Audit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Questions Modal */}
      {viewQuestionsModal && selectedExam && (
        <div className="modal-backdrop">
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '2rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Questionnaire: {selectedExam.title}</h3>
              <button onClick={() => setViewQuestionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {loadingQuestions ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>Loading questionnaire...</p>
              ) : examQuestions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No questions configured for this exam draft.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {examQuestions.map((q, idx) => (
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
          </div>
        </div>
      )}
    </div>
  );
}
