import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import { Award, FileSpreadsheet, Calendar, UserCheck } from 'lucide-react';

export default async function StudentGradesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch grades for this student
  // We query grades and join subjects (via class_subjects) and teachers
  const { data: grades, error } = await supabase
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
    .order('created_at', { ascending: false });

  // Calculate Average GPA/Score
  let averageGrade = 'N/A';
  if (grades && grades.length > 0) {
    const sum = grades.reduce((acc, curr) => acc + parseFloat(curr.grade_value), 0);
    averageGrade = (sum / grades.length).toFixed(2) + '%';
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px' }}>
      {/* Header with GPA badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Academic Report Card</h1>
          <p>Verify your scores, average performance stats, and tutor remarks.</p>
        </div>

        <div className="card animate-slide-up stagger-1" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem', backgroundColor: 'hsl(var(--accent-indigo))', borderColor: 'hsl(var(--accent-indigo-text) / 0.12)' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '40px', height: '40px' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'hsl(var(--accent-indigo-text))', fontWeight: 600, letterSpacing: '0.04em' }}>Cumulative GPA</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--accent-indigo-text))' }}>{averageGrade}</div>
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

        <div className="table-container">
          {grades && grades.length > 0 ? (
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
              <p>No grades have been posted for your account yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
