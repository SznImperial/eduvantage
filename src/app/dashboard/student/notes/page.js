'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { toggleMaterialCompletionAction } from '@/app/actions';
import { FileText, Download, CheckCircle, Circle, File, BookOpen } from 'lucide-react';

export default function StudentNotesPage() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [academicYears, setAcademicYears] = useState([]);
  const [academicTerms, setAcademicTerms] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial academic years
  useEffect(() => {
    const fetchYears = async () => {
      setLoading(true);
      const { data: years, error: yErr } = await supabase
        .from('academic_years')
        .select('*, academic_terms(*)')
        .order('name', { ascending: false });

      if (!yErr && years) {
        setAcademicYears(years);
        const active = years.find(y => y.is_active) || years[0];
        if (active) {
          setSelectedYearId(active.id);
          if (active.academic_terms?.length > 0) {
            setAcademicTerms(active.academic_terms);
            setSelectedTermId(active.academic_terms[0].id);
          }
        }
      }
      setLoading(false);
    };

    fetchYears();
  }, [supabase]);

  const handleYearChange = (yearId) => {
    setSelectedYearId(yearId);
    const year = academicYears.find(y => y.id === yearId);
    if (year && year.academic_terms?.length > 0) {
      setAcademicTerms(year.academic_terms);
      setSelectedTermId(year.academic_terms[0].id);
    } else {
      setAcademicTerms([]);
      setSelectedTermId('');
    }
  };

  // Fetch materials when selected year/term changes
  useEffect(() => {
    if (!selectedYearId || !selectedTermId) return;

    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();

      // Get student's enrolled class
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('class_id, academic_year_id')
        .eq('student_id', user.id);

      const enrollments = enrolls?.find(e => e.academic_year_id === selectedYearId) || enrolls?.[0];

      if (!enrollments) {
        setMaterials([]);
        setLoadingMaterials(false);
        return;
      }

      // Get class subjects for that class
      const { data: classSubjects } = await supabase
        .from('class_subjects')
        .select('id, subjects(name, code), teacher:profiles!class_subjects_teacher_id_fkey(first_name, last_name)')
        .eq('class_id', enrollments.class_id);

      if (!classSubjects || classSubjects.length === 0) {
        setMaterials([]);
        setLoadingMaterials(false);
        return;
      }

      const subjectIds = classSubjects.map(cs => cs.id);

      // Get materials for those class subjects
      const { data: mats, error: mErr } = await supabase
        .from('study_materials')
        .select(`
          id, class_subject_id, title, description, file_url, file_size_bytes, created_at,
          material_completions(student_id)
        `)
        .in('class_subject_id', subjectIds)
        .eq('academic_term_id', selectedTermId)
        .order('created_at', { ascending: false });

      if (mErr) {
        setError(mErr.message);
      } else {
        const formatted = mats.map(m => {
          const subjectInfo = classSubjects.find(cs => cs.id === m.class_subject_id);
          const isCompleted = m.material_completions && m.material_completions.some(mc => mc.student_id === user.id);
          return {
            ...m,
            subject: subjectInfo?.subjects,
            teacher: subjectInfo?.teacher,
            isCompleted: !!isCompleted
          };
        });
        setMaterials(formatted);
      }
      setLoadingMaterials(false);
    };

    fetchMaterials();
  }, [selectedYearId, selectedTermId, supabase]);

  const handleToggleCompletion = async (materialId, currentStatus) => {
    startTransition(async () => {
      const newStatus = !currentStatus;
      // Optimistically update UI
      setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, isCompleted: newStatus } : m));
      
      const res = await toggleMaterialCompletionAction(materialId, newStatus);
      if (res?.error) {
        setError(res.error);
        // Revert on error
        setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, isCompleted: currentStatus } : m));
      }
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Class Notes &amp; Materials</h1>
          <p>Download study materials from your teachers and mark them as completed.</p>
        </div>
      </div>

      <div className="card animate-slide-up stagger-1" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Session</label>
            {loading ? (
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Loading sessions...</div>
            ) : (
              <select className="input" value={selectedYearId} onChange={(e) => handleYearChange(e.target.value)} style={{ margin: 0 }}>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Term</label>
            <select className="input" value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)} style={{ margin: 0 }} disabled={academicTerms.length === 0}>
              {academicTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card animate-slide-up stagger-2">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="stat-icon stat-icon-violet" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
            <BookOpen size={18} />
          </div>
          Available Materials
        </h3>

        {loadingMaterials ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))' }}>Loading materials...</div>
        ) : materials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon" style={{ width: '48px', height: '48px', background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
              <FileText size={24} />
            </div>
            <div>No study materials posted for the selected term.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {materials.map(mat => (
              <div key={mat.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid hsl(var(--border))', borderRadius: '12px', background: mat.isCompleted ? 'hsl(var(--accent-emerald) / 0.05)' : 'transparent', transition: 'all 0.2s ease' }}>
                
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-primary">{mat.subject?.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>• {new Date(mat.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: 'hsl(var(--foreground))' }}>{mat.title}</h4>
                  {mat.description && <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 0.5rem 0' }}>{mat.description}</p>}
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    Posted by: {mat.teacher?.first_name} {mat.teacher?.last_name}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    <Download size={16} />
                    Download ({formatBytes(mat.file_size_bytes)})
                  </a>

                  <button 
                    onClick={() => handleToggleCompletion(mat.id, mat.isCompleted)}
                    disabled={isPending}
                    className="btn"
                    style={{ 
                      padding: '0.5rem 1rem',
                      background: mat.isCompleted ? 'transparent' : 'hsl(var(--foreground))',
                      color: mat.isCompleted ? 'hsl(var(--accent-emerald))' : 'hsl(var(--background))',
                      border: mat.isCompleted ? '1px solid hsl(var(--accent-emerald))' : 'none'
                    }}
                  >
                    {mat.isCompleted ? (
                      <>
                        <CheckCircle size={16} />
                        Completed
                      </>
                    ) : (
                      <>
                        <Circle size={16} />
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
