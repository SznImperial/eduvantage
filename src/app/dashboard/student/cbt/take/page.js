'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { 
  Clock, 
  ShieldAlert, 
  Monitor, 
  Mic, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import { submitCbtExamAction } from '@/app/actions';

function CBTTerminalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('id') || '';
  const supabase = createClient();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');

  // Navigation & Timer
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Proctoring States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [noiseSpikes, setNoiseSpikes] = useState(0);
  const [isViolated, setIsViolated] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  // Media Devices
  const [mediaError, setMediaError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const videoRef = useRef(null);

  const videoCallbackRef = (node) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      node.srcObject = mediaStreamRef.current;
    }
  };

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const micIntervalRef = useRef(null);

  function stopProctoringStreams() {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
    }
  }

  function calculateScore() {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) {
        score++;
      }
    });
    return score;
  }

  async function handleAutoSubmit(finalTabSwitches, finalNoiseSpikes) {
    if (submitting) return;
    setSubmitting(true);
    stopProctoringStreams();

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    const finalScore = calculateScore();
    const violated = finalTabSwitches >= 3;

    try {
      await submitCbtExamAction(
        exam.id,
        answers,
        finalScore,
        questions.length,
        finalTabSwitches,
        finalNoiseSpikes,
        violated
      );
    } catch (err) {
      console.error(err);
    } finally {
      router.replace('/dashboard/student/cbt');
    }
  }

  // Load Exam Details
  useEffect(() => {
    if (!examId) return;

    async function loadExam() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/dashboard/student/cbt');
          return;
        }
        setStudentId(user.id);
        setStudentName(`${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`);

        // Fetch Exam
        const { data: examData } = await supabase
          .from('cbt_exams')
          .select('*')
          .eq('id', examId)
          .single();

        if (!examData) {
          router.replace('/dashboard/student/cbt');
          return;
        }

        // Fetch Questions
        const { data: qList } = await supabase
          .from('cbt_questions')
          .select('*')
          .eq('exam_id', examId);

        setExam(examData);
        setQuestions(qList || []);
        setTimeLeft(examData.duration_minutes * 60);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId]);

  // Window Unload Warning
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Warning! Navigating away will submit your answers automatically.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, isViolated, submitting]);

  // Fullscreen Listener
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenError(true);
      } else {
        setFullscreenError(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, isViolated, submitting]);

  // Tab switching & Visibility blur
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const triggerViolationWarning = () => {
      setTabSwitches(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setIsViolated(true);
          handleAutoSubmit(newCount, noiseSpikes);
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        triggerViolationWarning();
      } else {
        setIsBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
      triggerViolationWarning();
    };

    const handleWindowFocus = () => {
      setIsBlurred(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [examStarted, isViolated, submitting, noiseSpikes]);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || isViolated || timeLeft === null || timeLeft <= 0 || submitting) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit(tabSwitches, noiseSpikes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, isViolated, timeLeft, submitting, tabSwitches, noiseSpikes]);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request rejected:', err);
    }
  };

  const startProctoringStreams = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Audio Level Analyzer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      audioAnalyserRef.current = analyser;

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      micIntervalRef.current = setInterval(() => {
        if (!audioAnalyserRef.current) return;
        audioAnalyserRef.current.getFloatTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);

        let db = 20 * Math.log10(rms);
        if (!isFinite(db)) db = -100;

        if (db > -40) {
          setNoiseSpikes(prev => prev + 1);
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      setMediaError('Proctoring error: Camera and Microphone inputs are required. Please permit access.');
    }
  };


  const handleBeginExam = async () => {
    setMediaError('');
    await requestFullscreen();
    await startProctoringStreams();

    if (mediaStreamRef.current) {
      setExamStarted(true);
    }
  };

  const handleSelectAnswer = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };


  const handleSubmitExam = async () => {
    setSubmitting(true);
    stopProctoringStreams();

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    const finalScore = calculateScore();

    const res = await submitCbtExamAction(
      exam.id,
      answers,
      finalScore,
      questions.length,
      tabSwitches,
      noiseSpikes,
      false
    );

    if (res.error) {
      setSubmitError(res.error);
      setSubmitting(false);
    } else {
      router.replace('/dashboard/student/cbt');
    }
  };


  // Keyboard Copy/Paste Blocks
  useEffect(() => {
    if (!examStarted || isViolated || submitting) return;

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'u', 'a', 'x'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, isViolated, submitting]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'hsl(var(--background))' }}>
        <p style={{ fontWeight: 650, fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>Loading proctor terminal...</p>
      </div>
    );
  }

  // Pre-test Agreement screen
  if (!examStarted && exam) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--muted) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <ShieldAlert size={48} style={{ color: 'hsl(var(--destructive))', margin: '0 auto 0.75rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 850, textTransform: 'uppercase' }}>Integrity Verification Panel</h2>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', marginTop: '0.25rem' }}>Exam: {exam.title}</p>
          </div>

          {mediaError && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              <span>{mediaError}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>Required Protocols</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.825rem', color: 'hsl(var(--primary))' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', marginTop: '0.4rem', flexShrink: 0 }} />
                <span>Webcam Stream must remain active and visible.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', marginTop: '0.4rem', flexShrink: 0 }} />
                <span>Microphone will monitor ambient decibel noise spikes.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', marginTop: '0.4rem', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: 'hsl(var(--destructive))' }}>Navigating away or switching tabs 3 times results in instant lockout submission.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 650 }}>
              Duration: {exam.duration_minutes} Mins
            </span>
            <button onClick={handleBeginExam} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
              Agree & Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lockout / Infraction Screen
  if (isViolated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--destructive) / 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <ShieldAlert size={64} style={{ color: 'hsl(var(--destructive))', margin: '0 auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 850, textTransform: 'uppercase', color: 'hsl(var(--destructive))' }}>Testing Session Blocked</h2>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
            You exited the active testing environment 3 times. This constitutes a severe integrity violation.
          </p>
          <div style={{ padding: '0.75rem', border: '1px solid hsl(var(--destructive))', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontWeight: 750, fontSize: '0.8rem' }}>
            SESSION STATUS: TERMINATED
          </div>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            Your current selections have been auto-saved. Please report to your course instructor.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'hsl(var(--muted) / 0.08)', userSelect: 'none' }}>
      {/* Top Banner */}
      <header className="card" style={{ padding: '0.75rem 1.5rem', borderRadius: 0, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--destructive))', display: 'inline-block' }} />
            <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', trackingLetter: '1px' }}>Proctor Terminal</strong>
          </div>
          {studentName && (
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 650 }}>
              User: {studentName}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--destructive))', fontWeight: 800 }}>
            <Clock size={16} />
            <span>Time Left: {timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
          </div>

          <button onClick={handleSubmitExam} className="btn btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem' }} disabled={submitting}>
            {submitting ? 'Sending answers...' : 'Finish Exam'}
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="responsive-grid-3-2" style={{ flex: 1, gap: '1.5rem', padding: '1.5rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Left Side: Active Question Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {fullscreenError && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={15} />
              <span>Full Screen Violation: Please return browser window to fullscreen immediately!</span>
            </div>
          )}

          {isBlurred && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={15} />
              <span>Tab Focus lost! Return window focus now.</span>
            </div>
          )}

          {currentQuestion && (
            <div className="card" style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--muted-foreground))' }}>
                    QUESTION {currentIndex + 1} OF {questions.length}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                    Choose one correct option key
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '2rem' }}>
                  {currentQuestion.question_text}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const label = currentQuestion[`option_${opt.toLowerCase()}`];
                    const selected = answers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                        style={{
                          width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                          backgroundColor: selected ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                          borderColor: selected ? 'hsl(var(--primary))' : 'var(--border)'
                        }}
                      >
                        <span style={{
                          width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800,
                          backgroundColor: selected ? 'hsl(var(--primary))' : 'transparent',
                          color: selected ? 'white' : 'inherit'
                        }}>
                          {opt}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <ArrowLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1))}
                  disabled={currentIndex === questions.length - 1}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Proctor Status feeds & question index grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Webcam Feed */}
          <div className="card" style={{ padding: '0.75rem', overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              📹 Active Proctor Feed
            </h4>
            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '4/3', position: 'relative' }}>
              <video 
                ref={videoCallbackRef}
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
              />
              <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#fff', fontSize: '0.7rem', fontWeight: 650 }}>
                Live Stream Active
              </div>
            </div>
          </div>

          {/* Audit Metrics log */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Testing Metrics
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tab Focus Switches:</span>
                <strong style={{ color: tabSwitches > 0 ? 'hsl(var(--destructive))' : 'inherit' }}>
                  {tabSwitches} / 3
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Auditory spikes (dBFS):</span>
                <strong style={{ color: noiseSpikes > 5 ? 'hsl(var(--destructive))' : 'inherit' }}>
                  {noiseSpikes}
                </strong>
              </div>
            </div>
          </div>

          {/* Index grid mapping */}
          <div className="card" style={{ padding: '1rem', flex: 1 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Questions Registry
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {questions.map((q, idx) => {
                const isSelected = answers[q.id] !== undefined;
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={isActive ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{
                      width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected && !isActive ? 'hsl(var(--primary) / 0.12)' : '',
                      borderColor: isSelected && !isActive ? 'hsl(var(--primary) / 0.4)' : ''
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TakeExamPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', fontWeight: 650 }}>Loading exam terminal...</div>}>
      <CBTTerminalContent />
    </Suspense>
  );
}
