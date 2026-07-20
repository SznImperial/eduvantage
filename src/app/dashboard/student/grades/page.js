'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Award, FileSpreadsheet, Calendar, UserCheck, Loader2 } from 'lucide-react';

export default function StudentGradesPage() {
  const supabase = createClient();
  
  // Data states
  const [academicYears, setAcademicYears] = useState([]);
  const [academicTerms, setAcademicTerms] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial academic years and terms
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

  // Handle Year Change
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

  // Fetch grades when selected year or term changes
  useEffect(() => {
    if (!selectedYearId || !selectedTermId) return;

    const fetchGrades = async () => {
      setLoadingGrades(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: gErr } = await supabase
        .from('grades')
        .select(`
          id,
          grade_value,
          remarks,
          created_at,
          class_subjects(
            subjects(name, code)
          ),
          graded_by_profile: profiles!grades_graded_by_fkey(first_name, last_name)
        `)
        .eq('student_id', user.id)
        .eq('academic_year_id', selectedYearId)
        .eq('academic_term_id', selectedTermId)
        .order('created_at', { ascending: false });

      if (gErr) {
        setError(gErr.message);
      } else {
        setGrades(data || []);
      }
      setLoadingGrades(false);
    };

    fetchGrades();
  }, [selectedYearId, selectedTermId, supabase]);

  // Calculate Average GPA/Score
  let averageGrade = 'N/A';
  if (grades && grades.length > 0) {
    const sum = grades.reduce((acc, curr) => acc + parseFloat(curr.grade_value), 0);
    averageGrade = (sum / grades.length).toFixed(2) + '%';
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', paddingBottom: '3rem' }}>
      {/* Header with GPA badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Academic Report Card</h1>
          <p>Verify your scores, average performance stats, and tutor remarks.</p>
        </div>

        <div className="card animate-slide-up stagger-1" style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem', backgroundColor: 'hsl(var(--accent-indigo))', borderColor: 'hsl(var(--accent-indigo-text) / 0.12)' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '40px', height: '40px' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'hsl(var(--accent-indigo-text))', fontWeight: 600, letterSpacing: '0.04em' }}>Cumulative GPA</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--accent-indigo-text))' }}>{averageGrade}</div>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="card animate-slide-up stagger-1" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Session</label>
            {loading ? (
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Loading sessions...</div>
            ) : (
              <select 
                className="input" 
                value={selectedYearId} 
                onChange={(e) => handleYearChange(e.target.value)}
                style={{ margin: 0 }}
              >
                <option value="">Select session...</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Term</label>
            <select 
              className="input" 
              value={selectedTermId} 
              onChange={(e) => setSelectedTermId(e.target.value)}
              style={{ margin: 0 }}
              disabled={academicTerms.length === 0}
            >
              <option value="">Select term...</option>
              {academicTerms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="card animate-slide-up stagger-2">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="stat-icon stat-icon-violet" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
            <FileSpreadsheet size={18} />
          </div>
          Registered Subject Marks
        </h3>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>{error}</span>
          </div>
        )}

        <div className="table-container">
          {loadingGrades ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="animate-spin" /> Fetching terminal scores...
            </div>
          ) : grades.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Subject</th>
                  <th>Obtained Score</th>
                  <th>Tutor Remarks</th>
                  <th>Graded On</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--accent-indigo-text))' }}>
                      {grade.class_subjects?.subjects?.code}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {grade.class_subjects?.subjects?.name}
                    </td>
                    <td>
                      <span className={`badge ${
                        parseFloat(grade.grade_value) >= 80 ? 'badge-success' :
                        parseFloat(grade.grade_value) >= 50 ? 'badge-primary' : 'badge-danger'
                      }`} style={{ fontWeight: 700 }}>
                        {parseFloat(grade.grade_value).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                      {grade.remarks || 'No remarks provided.'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={12} /> {new Date(grade.created_at).toLocaleDateString()}
                        </span>
                        {grade.graded_by_profile && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                            <UserCheck size={12} /> {grade.graded_by_profile.first_name} {grade.graded_by_profile.last_name}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileSpreadsheet size={24} />
              </div>
              <p>No grades have been posted for your account under the selected session/term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
