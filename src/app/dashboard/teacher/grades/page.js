'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { FileSpreadsheet, Save, CheckCircle2, ShieldAlert, Loader2, Award, Info } from 'lucide-react';
import { saveGradesAction } from '@/app/actions';

export default function TeacherGradesPage() {
  const supabase = createClient();
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(''); // class_subject_id
  const [students, setStudents] = useState([]);
  const [gradeRecords, setGradeRecords] = useState({}); // studentId -> { ca1, ca2, exam, gradeValue, remarks, status }
  
  // Academic Session States
  const [academicYears, setAcademicYears] = useState([]);
  const [academicTerms, setAcademicTerms] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  // Loading & status
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch teacher's assigned subjects/classes & academic years
  useEffect(() => {
    const fetchCoursesAndYears = async () => {
      setLoadingCourses(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const [coursesRes, yearsRes, profileRes] = await Promise.all([
        supabase
          .from('class_subjects')
          .select('id, classes(id, name), subjects(name, code)')
          .eq('teacher_id', user.id),
        supabase
          .from('academic_years')
          .select('*, academic_terms(*)')
          .order('name', { ascending: false }),
        supabase
          .from('profiles')
          .select('schools(active_academic_year_id, active_academic_term_id)')
          .eq('id', user.id)
          .single()
      ]);

      if (!coursesRes.error && coursesRes.data) {
        setClassSubjects(coursesRes.data);
      }

      if (!yearsRes.error && yearsRes.data) {
        setAcademicYears(yearsRes.data);
        
        const activeYearId = profileRes.data?.schools?.active_academic_year_id;
        const activeTermId = profileRes.data?.schools?.active_academic_term_id;

        if (activeYearId) {
          setSelectedYearId(activeYearId);
          const activeYear = yearsRes.data.find(y => y.id === activeYearId);
          if (activeYear) {
            setAcademicTerms(activeYear.academic_terms || []);
            setSelectedTermId(activeTermId || '');
          }
        } else if (yearsRes.data.length > 0) {
          setSelectedYearId(yearsRes.data[0].id);
          setAcademicTerms(yearsRes.data[0].academic_terms || []);
          if (yearsRes.data[0].academic_terms?.length > 0) {
            setSelectedTermId(yearsRes.data[0].academic_terms[0].id);
          }
        }
      }

      setLoadingCourses(false);
    };

    fetchCoursesAndYears();
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

  // Fetch students and existing grade records when selected mapping, year, or term changes
  useEffect(() => {
    if (!selectedMapping || !selectedYearId || !selectedTermId) {
      setStudents([]);
      return;
    }

    const fetchStudentsAndGrades = async () => {
      setLoadingStudents(true);
      setError(''); setSuccess('');

      // Find the class_id from selectedMapping
      const mapping = classSubjects.find(cs => cs.id === selectedMapping);
      if (!mapping || !mapping.classes) return;

      const classId = mapping.classes.id;

      // 1. Fetch students enrolled in this class
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('student_id, profiles(id, first_name, last_name, email)')
        .eq('class_id', classId);

      if (enrollError) {
        setError(enrollError.message);
        setLoadingStudents(false);
        return;
      }

      const classStudents = enrollments.map(e => e.profiles).filter(Boolean);
      setStudents(classStudents);

      // 2. Fetch existing grade records for this class_subject and term
      const { data: existingGrades, error: gradeError } = await supabase
        .from('grades')
        .select('student_id, grade_value, ca1_score, ca2_score, exam_score, remarks, status')
        .eq('class_subject_id', selectedMapping)
        .eq('academic_term_id', selectedTermId);

      if (gradeError) {
        setError(gradeError.message);
        setLoadingStudents(false);
        return;
      }

      // Populate form state
      const records = {};
      classStudents.forEach(st => {
        const existing = existingGrades.find(g => g.student_id === st.id);
        records[st.id] = {
          ca1: existing ? existing.ca1_score : '',
          ca2: existing ? existing.ca2_score : '',
          exam: existing ? existing.exam_score : '',
          gradeValue: existing ? existing.grade_value : '',
          remarks: existing ? (existing.remarks || '') : '',
          status: existing ? existing.status : 'draft'
        };
      });

      setGradeRecords(records);
      setLoadingStudents(false);
    };

    fetchStudentsAndGrades();
  }, [selectedMapping, selectedYearId, selectedTermId, classSubjects, supabase]);

  const handleComponentChange = (studentId, field, value) => {
    let numericVal = parseFloat(value);
    
    // Clamp values visually as the user types
    if (!isNaN(numericVal)) {
      if (field === 'ca1' || field === 'ca2') {
        if (numericVal > 20) value = '20';
      } else if (field === 'exam') {
        if (numericVal > 60) value = '60';
      }
    }

    setGradeRecords(prev => {
      const rec = { ...prev[studentId] };
      rec[field] = value;
      
      // Auto-calculate Total (gradeValue)
      const ca1 = parseFloat(rec.ca1) || 0;
      const ca2 = parseFloat(rec.ca2) || 0;
      const exam = parseFloat(rec.exam) || 0;
      rec.gradeValue = (ca1 + ca2 + exam).toFixed(2).replace(/\.00$/, ''); // nice formatting
      
      return {
        ...prev,
        [studentId]: rec
      };
    });
  };

  const handleRemarksChange = (studentId, remarks) => {
    setGradeRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(''); setSuccess('');

    // Prepare upsert values
    const upsertRecords = [];
    const studentIds = [];
    let hasValidationError = false;

    for (let st of students) {
      const rec = gradeRecords[st.id];
      if (!rec || (rec.ca1 === '' && rec.ca2 === '' && rec.exam === '')) continue; 

      const ca1Val = parseFloat(rec.ca1) || 0;
      const ca2Val = parseFloat(rec.ca2) || 0;
      const examVal = parseFloat(rec.exam) || 0;
      const totalVal = parseFloat(rec.gradeValue) || 0;

      if (ca1Val < 0 || ca1Val > 20 || ca2Val < 0 || ca2Val > 20 || examVal < 0 || examVal > 60) {
        hasValidationError = true;
        break;
      }

      studentIds.push(st.id);
      upsertRecords.push({
        student_id: st.id,
        ca1_score: ca1Val,
        ca2_score: ca2Val,
        exam_score: examVal,
        grade_value: totalVal,
        remarks: rec.remarks || null
      });
    }

    if (hasValidationError) {
      setError('Invalid scores detected! CA1 & CA2 must be 0-20. Exam must be 0-60.');
      setSaving(false);
      return;
    }

    if (upsertRecords.length === 0) {
      setError('Please input at least one score before saving.');
      setSaving(false);
      return;
    }

    // Call Server Action - server uses active session context automatically
    const result = await saveGradesAction(
      selectedMapping, 
      studentIds, 
      upsertRecords
    );

    if (result?.error) {
      setError(`Failed to save: ${result.error}`);
    } else {
      setSuccess('Class grades drafted successfully! Admins must publish them before students can view.');
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px' }}>
      <div className="page-header">
        <h1>Academic Gradebook</h1>
        <p>
          Enter Continuous Assessment and Exam scores. Results are saved as Drafts until an Admin publishes them.
        </p>
      </div>

      {/* Class Course, Academic Year & Term selectors */}
      <div className="card animate-slide-up stagger-1" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Course / Class Section</label>
            {loadingCourses ? (
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Loading assigned classes...</div>
            ) : (
              <select 
                className="input" 
                value={selectedMapping} 
                onChange={(e) => setSelectedMapping(e.target.value)}
                style={{ margin: 0 }}
              >
                <option value="">Choose course allocation...</option>
                {classSubjects.map(cs => (
                  <option key={cs.id} value={cs.id}>
                    {cs.classes?.name} — {cs.subjects?.name} ({cs.subjects?.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Session</label>
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
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Term</label>
            <select 
              className="input" 
              value={selectedTermId} 
              onChange={(e) => setSelectedTermId(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">Select term...</option>
              {academicTerms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Helper Context Alert */}
      <div className="alert alert-info" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Info size={16} />
        <span style={{ fontSize: '0.9rem' }}>
          <strong>Note:</strong> CBT exam and Assignment scores are <strong>not</strong> automatically imported. You may view them on their respective pages and manually enter the final scores here.
        </span>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="alert alert-error">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Roster & Grade Inputs */}
      {selectedMapping ? (
        loadingStudents ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 className="animate-spin" />
            <span>Fetching classroom roster...</span>
          </div>
        ) : students.length > 0 ? (
          <div className="card animate-slide-up stagger-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 700 }}>
                <div className="stat-icon stat-icon-violet" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                  <Award size={16} />
                </div>
                <span>Class Roster ({students.length} Students)</span>
              </div>
              
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving Drafts...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Drafts
                  </>
                )}
              </button>
            </div>

            <div className="table-container">
              <table className="table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th style={{ width: '10%' }}>1st C.A. (20)</th>
                    <th style={{ width: '10%' }}>2nd C.A. (20)</th>
                    <th style={{ width: '10%' }}>Exam (60)</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Total</th>
                    <th style={{ width: '25%' }}>Remarks</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const record = gradeRecords[student.id] || { ca1: '', ca2: '', exam: '', gradeValue: '', remarks: '', status: 'draft' };
                    return (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 600 }}>
                          {student.first_name} {student.last_name}
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            placeholder="0" 
                            min="0" max="20" step="0.01"
                            value={record.ca1}
                            onChange={(e) => handleComponentChange(student.id, 'ca1', e.target.value)}
                            style={{ padding: '0.35rem', fontSize: '0.825rem', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            placeholder="0" 
                            min="0" max="20" step="0.01"
                            value={record.ca2}
                            onChange={(e) => handleComponentChange(student.id, 'ca2', e.target.value)}
                            style={{ padding: '0.35rem', fontSize: '0.825rem', textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input" 
                            placeholder="0" 
                            min="0" max="60" step="0.01"
                            value={record.exam}
                            onChange={(e) => handleComponentChange(student.id, 'exam', e.target.value)}
                            style={{ padding: '0.35rem', fontSize: '0.825rem', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--brand-color)' }}>
                          {record.gradeValue || '-'}
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="input" 
                            placeholder="Teacher comment..." 
                            value={record.remarks} 
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {record.status === 'published' ? (
                            <span className="badge" style={{ backgroundColor: 'hsl(var(--success-muted))', color: 'hsl(var(--success))', fontSize: '0.75rem' }}>Published</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'hsl(var(--warning-muted))', color: 'hsl(var(--warning))', fontSize: '0.75rem' }}>Draft</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Award size={24} />
              </div>
              <p>No students are currently enrolled in the class associated with this course mapping.</p>
            </div>
          </div>
        )
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileSpreadsheet size={24} />
            </div>
            <p>Please select an active course allocation from the list.</p>
          </div>
        </div>
      )}
    </div>
  );
}
