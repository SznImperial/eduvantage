'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { ClipboardList, Clock, Award, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentCbtLobbyPage() {
  const supabase = createClient();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');

  const loadLobby = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Find enrollment class
      const { data: enroll } = await supabase
        .from('enrollments')
        .select('*, classes(name)')
        .eq('student_id', user.id)
        .single();

      if (enroll) {
        setClassName(enroll.classes?.name || 'Class');

        // 2. Fetch class subjects mapped to class
        const { data: classSubs } = await supabase
          .from('class_subjects')
          .select('*, subjects(name, code)')
          .eq('class_id', enroll.class_id);

        if (classSubs && classSubs.length > 0) {
          const classSubIds = classSubs.map(cs => cs.id);

          // 3. Fetch CBT exams that are APPROVED
          const { data: approvedExams } = await supabase
            .from('cbt_exams')
            .select('*')
            .eq('status', 'approved')
            .in('class_subject_id', classSubIds);

          // 4. Fetch student submissions
          const { data: subms } = await supabase
            .from('cbt_submissions')
            .select('*')
            .eq('student_id', user.id);

          if (approvedExams) {
            const enriched = approvedExams.map(exam => {
              const cs = classSubs.find(x => x.id === exam.class_subject_id);
              const sub = subms ? subms.find(s => s.exam_id === exam.id) : null;
              return {
                ...exam,
                subjectName: cs?.subjects?.name || 'Course',
                subjectCode: cs?.subjects?.code || '',
                submission: sub
              };
            });
            setExams(enriched);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLobby();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>CBT Examinations Lobby</h1>
        <p>Enter scheduled online quizzes, review testing rules, and check scored exam reports.</p>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Loading exam directory...</p>
          </div>
        </div>
      ) : !className ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <div className="empty-state-icon">
              <AlertCircle size={24} />
            </div>
            <p>You are not currently enrolled in a class section. Contact administration to join examinations.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Rules / Guide Banner */}
          <div className="card glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid hsl(var(--primary))' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.4rem', color: 'hsl(var(--primary))' }}>
              🔒 Proctored Testing Guidelines
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
              Once you start a CBT test, it runs in fullscreen mode. Switching tabs, minimizing the browser window, or navigating away will flag a proctor warning. The system enforces an automatic lockout/submission on the third infraction. Ensure your microphone is active; loud audio noise will also trigger warning indicators.
            </p>
          </div>

          {/* Exam Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {exams.length > 0 ? (
              exams.map(exam => {
                const isTaken = !!exam.submission;
                const isReleased = exam.submission?.status === 'released';
                const percentage = isTaken && exam.submission.total_questions > 0 
                  ? ((exam.submission.score / exam.submission.total_questions) * 100).toFixed(0) 
                  : 0;

                return (
                  <div key={exam.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifycontent: 'space-between', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--muted-foreground))' }}>
                          <Clock size={12} /> {exam.duration_minutes} Minutes
                        </span>
                        {isTaken ? (
                          isReleased ? (
                            <span className="badge badge-primary" style={{ backgroundColor: 'var(--success)', color: 'white', fontSize: '0.7rem' }}>Results Released</span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Awaiting Grades Release</span>
                          )
                        ) : (
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Active & Ready</span>
                        )}
                      </div>
                      <strong style={{ fontSize: '1.05rem', color: 'hsl(var(--primary))', marginTop: '0.25rem' }}>{exam.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 650 }}>
                        {exam.subjectName} ({exam.subjectCode})
                      </div>
                    </div>

                    {isTaken ? (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                          Test Status: <strong style={{ color: 'var(--success)' }}>Submitted</strong>
                        </span>
                        {isReleased ? (
                          <strong style={{ fontSize: '0.95rem' }}>
                            Score: {exam.submission.score}/{exam.submission.total_questions} ({percentage}%)
                          </strong>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Pending Release</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <Link href={`/dashboard/student/cbt/take?id=${exam.id}`} className="btn btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Play size={13} /> Begin Examination
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                  <div className="empty-state-icon">
                    <ClipboardList size={24} />
                  </div>
                  <p>No computer-based tests scheduled for your class at this time.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
