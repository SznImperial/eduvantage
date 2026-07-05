'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { FileSpreadsheet, Save, CheckCircle2, ShieldAlert, Loader2, Award } from 'lucide-react';
import { saveGradesAction } from '@/app/actions';

export default function TeacherGradesPage() {
  const supabase = createClient();
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(''); // class_subject_id
  const [students, setStudents] = useState([]);
  const [gradeRecords, setGradeRecords] = useState({}); // studentId -> { gradeValue, remarks }
  
  // Academic Session States
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');

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
      
      const [coursesRes, yearsRes] = await Promise.all([
        supabase
          .from('class_subjects')
          .select('id, classes(id, name), subjects(name, code)')
          .eq('teacher_id', user.id),
        supabase
          .from('academic_years')
          .select('*')
          .order('name', { ascending: false })
      ]);

      if (!coursesRes.error && coursesRes.data) {
        setClassSubjects(coursesRes.data);
      }

      if (!yearsRes.error && yearsRes.data) {
        setAcademicYears(yearsRes.data);
        const active = yearsRes.data.find(y => y.is_active);
        if (active) {
          setSelectedYearId(active.id);
        } else if (yearsRes.data.length > 0) {
          setSelectedYearId(yearsRes.data[0].id);
        }
      }

      setLoadingCourses(false);
    };

    fetchCoursesAndYears();
  }, [supabase]);

  // Fetch students and existing grade records when selected mapping, year, or term changes
  useEffect(() => {
    if (!selectedMapping || !selectedYearId || !selectedTerm) {
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

      // 2. Fetch existing grade records for this class_subject, year, and term
      const { data: existingGrades, error: gradeError } = await supabase
        .from('grades')
        .select('student_id, grade_value, remarks')
        .eq('class_subject_id', selectedMapping)
        .eq('academic_year_id', selectedYearId)
        .eq('term', selectedTerm);

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
          gradeValue: existing ? existing.grade_value : '',
          remarks: existing ? (existing.remarks || '') : ''
        };
      });

      setGradeRecords(records);
      setLoadingStudents(false);
    };

    fetchStudentsAndGrades();
  }, [selectedMapping, selectedYearId, selectedTerm, classSubjects, supabase]);

  const handleGradeChange = (studentId, gradeValue) => {
    setGradeRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        gradeValue
      }
    }));
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
      if (!rec || rec.gradeValue === '') continue; // Skip empty fields

      const val = parseFloat(rec.gradeValue);
      if (isNaN(val) || val < 0 || val > 100) {
        hasValidationError = true;
        break;
      }

      studentIds.push(st.id);
      upsertRecords.push({
        student_id: st.id,
        grade_value: val,
        remarks: rec.remarks || null
      });
    }

    if (hasValidationError) {
      setError('Grade values must be valid numeric values between 0.00 and 100.00.');
      setSaving(false);
      return;
    }

    if (upsertRecords.length === 0) {
      setError('Please input at least one grade value before saving.');
      setSaving(false);
      return;
    }

    // Call Server Action with academic year and term
    const result = await saveGradesAction(
      selectedMapping, 
      studentIds, 
      upsertRecords, 
      selectedYearId, 
      selectedTerm
    );

    if (result?.error) {
      setError(`Failed to save: ${result.error}`);
    } else {
      setSuccess('Class grades published to database successfully!');
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <h1>Academic Gradebook</h1>
        <p>
          Input terminal or course grade marks, publish results directly to student records.
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
              onChange={(e) => setSelectedYearId(e.target.value)}
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
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>
        </div>
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
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Publish Grades
                  </>
                )}
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Grade Value (0 - 100)</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const record = gradeRecords[student.id] || { gradeValue: '', remarks: '' };
                    return (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 600, width: '30%' }}>
                          {student.first_name} {student.last_name}
                        </td>
                        <td style={{ width: '25%' }}>
                          <input 
                            type="number" 
                            className="input" 
                            placeholder="Score (e.g. 88.5)" 
                            min="0"
                            max="100"
                            step="0.01"
                            value={record.gradeValue}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="input" 
                            placeholder="Add teacher comment..." 
                            value={record.remarks} 
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
                          />
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
