'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { uploadMaterialAction, deleteMaterialAction } from '@/app/actions';
import { FileText, Upload, Trash2, CheckCircle, Clock, File, Download } from 'lucide-react';

export default function TeacherNotesPage() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [classSubjects, setClassSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicTerms, setAcademicTerms] = useState([]);
  
  const [selectedMapping, setSelectedMapping] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingCompletionsFor, setViewingCompletionsFor] = useState(null);

  // Fetch initial data (class_subjects and years)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();

      // Get teacher's assigned subjects
      const { data: mappings, error: mappingErr } = await supabase
        .from('class_subjects')
        .select(`
          id,
          classes(id, name),
          subjects(id, name, code)
        `)
        .eq('teacher_id', user.id);

      if (mappingErr) {
        console.error("Error fetching mappings:", mappingErr);
      }

      if (mappings) {
        setClassSubjects(mappings);
        if (mappings.length > 0) setSelectedMapping(mappings[0].id);
      }

      // Get academic years
      const { data: years } = await supabase
        .from('academic_years')
        .select('*, academic_terms(*)')
        .eq('school_id', profile?.school_id)
        .order('name', { ascending: false });

      if (years) {
        setAcademicYears(years);
        const activeYear = years.find(y => y.is_active) || years[0];
        if (activeYear) {
          setSelectedYearId(activeYear.id);
          if (activeYear.academic_terms?.length > 0) {
            setAcademicTerms(activeYear.academic_terms);
            setSelectedTermId(activeYear.academic_terms[0].id);
          }
        }
      }
      setLoading(false);
    };

    fetchData();
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

  // Fetch materials when filters change
  useEffect(() => {
    if (!selectedMapping || !selectedTermId) {
      setMaterials([]);
      return;
    }

    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      const classId = classSubjects.find(cs => cs.id === selectedMapping)?.classes?.id;

      // 1. Fetch materials
      const { data: mats, error: err } = await supabase
        .from('study_materials')
        .select(`
          id, title, description, file_url, file_type, file_size_bytes, created_at,
          material_completions(student_id)
        `)
        .eq('class_subject_id', selectedMapping)
        .eq('academic_term_id', selectedTermId)
        .order('created_at', { ascending: false });

      if (err) {
        setError(err.message);
        setLoadingMaterials(false);
        return;
      }

      // 2. Fetch total students enrolled in this class to calculate completion ratio
      let totalEnrolled = 0;
      let enrollmentsData = [];
      if (classId) {
        const { data: enr } = await supabase
          .from('enrollments')
          .select('student_id, profiles(first_name, last_name, email)')
          .eq('class_id', classId);
        if (enr) {
          totalEnrolled = enr.length;
          enrollmentsData = enr;
        }
      }

      // Format materials with completion data
      const formattedMats = mats.map(m => {
        const completedStudentIds = m.material_completions.map(mc => mc.student_id);
        const completionsList = enrollmentsData.map(e => ({
          student: e.profiles,
          isCompleted: completedStudentIds.includes(e.student_id)
        }));
        return {
          ...m,
          totalEnrolled,
          completedCount: completedStudentIds.length,
          completionsList
        };
      });

      setMaterials(formattedMats);
      setLoadingMaterials(false);
    };

    fetchMaterials();
  }, [selectedMapping, selectedTermId, selectedYearId, classSubjects, supabase]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    formData.append('class_subject_id', selectedMapping);
    formData.append('academic_term_id', selectedTermId);

    startTransition(async () => {
      const res = await uploadMaterialAction(formData);
      if (res?.error) setError(res.error);
      else {
        setSuccess('Study material uploaded successfully!');
        setShowUploadModal(false);
        // Soft refresh the materials by re-triggering the selectedTermId (hacky but works locally)
        setSelectedTermId(prev => prev);
      }
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    startTransition(async () => {
      const res = await deleteMaterialAction(id);
      if (res?.error) setError(res.error);
      else {
        setSuccess('Material deleted.');
        setMaterials(prev => prev.filter(m => m.id !== id));
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
    <div className="animate-fade-in" style={{ maxWidth: '1000px', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Class Notes &amp; Materials</h1>
          <p>Upload files for your students and track who has completed reading/writing them.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} disabled={loading || !selectedMapping}>
          <Upload size={16} />
          Upload Material
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      <div className="card animate-slide-up stagger-1" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subject</label>
            {loading ? (
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Loading subjects...</div>
            ) : (
              <select 
                className="input" 
                value={selectedMapping} 
                onChange={(e) => setSelectedMapping(e.target.value)} 
                style={{ margin: 0 }}
              >
                {classSubjects.length === 0 ? (
                  <option value="" disabled>No subjects assigned</option>
                ) : (
                  classSubjects.map(cs => (
                    <option key={cs.id} value={cs.id}>
                      {cs.classes?.name || 'Unknown'} - {cs.subjects?.name || 'Unknown'}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Session</label>
            <select className="input" value={selectedYearId} onChange={(e) => handleYearChange(e.target.value)} style={{ margin: 0 }}>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Term</label>
            <select className="input" value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)} disabled={academicTerms.length === 0} style={{ margin: 0 }}>
              {academicTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card animate-slide-up stagger-2">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
            <FileText size={18} />
          </div>
          Uploaded Materials
        </h3>

        {loadingMaterials ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))' }}>Loading materials...</div>
        ) : materials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))' }}>
            No materials found for this term.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>File Size</th>
                  <th>Date Posted</th>
                  <th>Completions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(mat => (
                  <tr key={mat.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{mat.title}</div>
                      {mat.description && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.description}</div>}
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <File size={12} /> {formatBytes(mat.file_size_bytes)}
                      </span>
                    </td>
                    <td>{new Date(mat.created_at).toLocaleDateString()}</td>
                    <td>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={() => setViewingCompletionsFor(mat)}
                      >
                        <div style={{ flex: 1, height: '6px', background: 'hsl(var(--secondary))', borderRadius: '3px', overflow: 'hidden', minWidth: '80px' }}>
                          <div style={{ height: '100%', width: `${mat.totalEnrolled > 0 ? (mat.completedCount / mat.totalEnrolled) * 100 : 0}%`, background: 'hsl(var(--accent-emerald))' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{mat.completedCount}/{mat.totalEnrolled}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', height: 'auto' }} title="Download">
                          <Download size={14} />
                        </a>
                        <button className="btn" style={{ padding: '0.35rem 0.5rem', height: 'auto', backgroundColor: 'hsl(var(--accent-red) / 0.1)', color: 'hsl(var(--accent-red))' }} onClick={() => handleDelete(mat.id)} disabled={isPending}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card animate-scale-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upload Study Material</h3>
              <button type="button" onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Material Title</label>
                <input type="text" name="title" className="input" required placeholder="e.g. Chapter 3: Thermodynamics Notes" />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea name="description" className="input" rows="2" placeholder="Brief instructions for students..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">File (PDF, DOCX, PPTX max 10MB)</label>
                <input 
                  type="file" 
                  name="file" 
                  className="input" 
                  required 
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  style={{ padding: '0.5rem' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingCompletionsFor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card animate-scale-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Completion Tracker</h3>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {viewingCompletionsFor.title}
                </p>
              </div>
              <button type="button" onClick={() => setViewingCompletionsFor(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {viewingCompletionsFor.completionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>No students enrolled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {viewingCompletionsFor.completionsList.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'hsl(var(--secondary) / 0.5)', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.student?.first_name} {c.student?.last_name}</span>
                      {c.isCompleted ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--accent-emerald))', fontSize: '0.75rem', fontWeight: 600 }}>
                          <CheckCircle size={14} /> Completed
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => setViewingCompletionsFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
