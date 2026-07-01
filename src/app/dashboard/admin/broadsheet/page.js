'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  FileSpreadsheet, 
  Search, 
  Trophy, 
  Filter, 
  BookOpen, 
  AlertCircle, 
  TrendingUp, 
  BarChart3 
} from 'lucide-react';

export default function AdminBroadsheetPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  
  const [classSubjects, setClassSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Computed states
  const [rows, setRows] = useState([]);
  const [subjectAverages, setSubjectAverages] = useState({});

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch academic years
      const { data: years } = await supabase
        .from('academic_years')
        .select('*')
        .order('name', { ascending: false });
      if (years) {
        setAcademicYears(years);
        const active = years.find(y => y.is_active);
        if (active) setSelectedYearId(active.id);
        else if (years.length > 0) setSelectedYearId(years[0].id);
      }

      // 2. Fetch classes
      const { data: clsList } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      if (clsList) {
        setClasses(clsList);
        if (clsList.length > 0) setSelectedClassId(clsList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadBroadsheetData = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      // 1. Fetch class subjects
      const { data: csList } = await supabase
        .from('class_subjects')
        .select('*, subjects(name, code)')
        .eq('class_id', selectedClassId);
      setClassSubjects(csList || []);

      // 2. Fetch enrollments (students in class)
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('student_id, profiles(first_name, last_name, email)')
        .eq('class_id', selectedClassId);
      setEnrollments(enrolls || []);

      // 3. Fetch grades for students in this class
      if (enrolls && enrolls.length > 0) {
        const studentIds = enrolls.map(e => e.student_id);
        const { data: gradeList } = await supabase
          .from('grades')
          .select('*')
          .in('student_id', studentIds);
        setGrades(gradeList || []);
      } else {
        setGrades([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadsheetData();
  }, [selectedClassId, selectedYearId]);

  // Compute broadsheet rows in real-time
  useEffect(() => {
    if (enrollments.length === 0) {
      setRows([]);
      setSubjectAverages({});
      return;
    }

    // 1. Map students into rows
    const studentRows = enrollments.map(e => {
      const studentId = e.student_id;
      const studentName = `${e.profiles?.first_name || ''} ${e.profiles?.last_name || ''}`;
      
      const subjectScores = {};
      let total = 0;
      let count = 0;

      classSubjects.forEach(cs => {
        // Find grade for this student & subject mapping
        const matchingGrade = grades.find(g => g.student_id === studentId && g.class_subject_id === cs.id);
        if (matchingGrade) {
          const val = parseFloat(matchingGrade.grade_value);
          subjectScores[cs.id] = val;
          total += val;
          count++;
        }
      });

      const avg = count > 0 ? total / count : 0;

      return {
        studentId,
        studentName,
        subjectScores,
        totalScore: total,
        averageScore: avg,
        subjectsCount: count,
        rank: 0
      };
    });

    // 2. Sort rows by average score descending to compute rank
    const sorted = [...studentRows].sort((a, b) => b.averageScore - a.averageScore);
    sorted.forEach((row, idx) => {
      if (idx > 0 && row.averageScore === sorted[idx - 1].averageScore) {
        row.rank = sorted[idx - 1].rank;
      } else {
        row.rank = idx + 1;
      }
    });

    // 3. Compute subject averages
    const subAvgs = {};
    classSubjects.forEach(cs => {
      let sum = 0;
      let count = 0;
      sorted.forEach(row => {
        if (row.subjectScores[cs.id] !== undefined) {
          sum += row.subjectScores[cs.id];
          count++;
        }
      });
      subAvgs[cs.id] = count > 0 ? (sum / count).toFixed(1) : '-';
    });

    setRows(sorted);
    setSubjectAverages(subAvgs);
  }, [enrollments, classSubjects, grades]);

  const filteredRows = rows.filter(r => 
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Administrative Broadsheet</h1>
        <p>A comprehensive overview of student performance across all courses for the selected class section.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="card glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>Class Section</label>
          <select 
            className="input" 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>Academic Session</label>
          <select 
            className="input" 
            value={selectedYearId} 
            onChange={(e) => setSelectedYearId(e.target.value)}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(Active)' : ''}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>Search Student</label>
          <div style={{ position: 'relative' }}>
            <input 
              className="input" 
              placeholder="Filter by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.4rem 0.75rem 0.4rem 2rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
            <p>Compiling broadsheet database queries...</p>
          </div>
        </div>
      ) : rows.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
                  <th style={{ width: '60px', textAlign: 'center' }}><Trophy size={14} /></th>
                  <th style={{ minWidth: '180px' }}>Student Name</th>
                  {classSubjects.map(cs => (
                    <th key={cs.id} style={{ textAlign: 'center', minWidth: '120px' }}>
                      <div style={{ fontWeight: 700 }}>{cs.subjects?.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{cs.subjects?.code}</div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', minWidth: '80px', borderLeft: '1px solid var(--border)' }}>Avg %</th>
                  <th style={{ textAlign: 'center', minWidth: '80px' }}>Rank</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => (
                  <tr key={row.studentId}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                    </td>
                    <td style={{ fontWeight: 650 }}>{row.studentName}</td>
                    {classSubjects.map(cs => {
                      const score = row.subjectScores[cs.id];
                      const scoreClass = score !== undefined 
                        ? score >= 75 
                          ? 'text-success' 
                          : score < 40 
                            ? 'text-destructive' 
                            : ''
                        : '';
                      return (
                        <td key={cs.id} style={{ textAlign: 'center' }}>
                          <span className={scoreClass} style={{ fontWeight: score !== undefined ? 700 : 400 }}>
                            {score !== undefined ? score.toFixed(1) : '-'}
                          </span>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 800, borderLeft: '1px solid var(--border)', backgroundColor: 'hsl(var(--muted) / 0.08)' }}>
                      {row.averageScore.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, backgroundColor: 'hsl(var(--muted) / 0.08)' }}>
                      {row.rank} of {rows.length}
                    </td>
                  </tr>
                ))}
                
                {/* Subject Averages Row */}
                <tr style={{ backgroundColor: 'hsl(var(--muted) / 0.25)', fontWeight: 750 }}>
                  <td colSpan={2} style={{ textAlign: 'right' }}>Class Average:</td>
                  {classSubjects.map(cs => (
                    <td key={cs.id} style={{ textAlign: 'center' }}>
                      {subjectAverages[cs.id]}%
                    </td>
                  ))}
                  <td colSpan={2} style={{ borderLeft: '1px solid var(--border)' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <AlertCircle size={24} />
            </div>
            <p>No enrollment or academic grade records found for the selected parameters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
