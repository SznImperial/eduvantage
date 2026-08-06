"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateReportCommentAction } from '@/app/actions';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function AiCommentDraftModal({ 
  isOpen, 
  onClose, 
  studentId, 
  termId, 
  studentName, 
  subjectName, 
  ca1, 
  ca2, 
  exam, 
  gradeValue, 
  currentRemarks,
  onApply 
}) {
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState(currentRemarks || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remainingCount, setRemainingCount] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-generate if it's the first time and we have grades
    if (isOpen && !draft && !loading && !error && gradeValue) {
      handleGenerate();
    }
  }, [isOpen, gradeValue]); // intentionally excluding draft to avoid loops

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const res = await generateReportCommentAction(
      studentId, 
      termId, 
      subjectName, 
      ca1, 
      ca2, 
      exam, 
      gradeValue, 
      note
    );

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setDraft(res.draft);
      setRemainingCount(res.remaining);
    }
    
    setLoading(false);
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '550px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Sparkles size={18} style={{ color: '#1e3a8a' }} />
            AI Comment Draft
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'hsl(var(--muted) / 0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
          <strong>Generating for:</strong> {studentName} &middot; {subjectName}
          <div style={{ marginTop: '0.25rem', color: 'hsl(var(--muted-foreground))' }}>
            Grades — CA1: {ca1||0}, CA2: {ca2||0}, Exam: {exam||0} (Total: {gradeValue||0}%)
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Optional Note for the AI</span>
            <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>e.g. "Struggles with group work"</span>
          </label>
          <input 
            className="input" 
            placeholder="Add context to guide the generation..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          {remainingCount !== null ? (
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={12} /> {remainingCount} generations remaining
            </span>
          ) : (
            <span></span>
          )}
          
          <button 
            className="btn" 
            style={{ 
              backgroundColor: '#1e3a8a', 
              color: '#ffffff', 
              border: 'none',
              gap: '0.5rem',
              fontWeight: 600,
              padding: '0.5rem 1rem'
            }} 
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {draft ? 'Regenerate Draft' : 'Generate Draft'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Drafted Comment (Edit as needed)</label>
          <textarea 
            className="input" 
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your generated comment will appear here. You can manually edit it before applying."
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn" style={{ backgroundColor: 'transparent', border: '1px solid hsl(var(--border))' }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply} disabled={!draft || loading}>
            Apply to Report Card
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
