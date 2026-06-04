import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import { Calendar, CheckCircle2, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

export default async function StudentAttendancePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch attendance records for this student
  const { data: attendance, error } = await supabase
    .from('attendance')
    .select(`
      id,
      date,
      status,
      notes,
      classes(name)
    `)
    .eq('student_id', user.id)
    .order('date', { ascending: false });

  // Calculate statistics
  let totalDays = 0;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let excusedDays = 0;
  let rate = 'N/A';

  if (attendance && attendance.length > 0) {
    totalDays = attendance.length;
    presentDays = attendance.filter(a => a.status === 'present').length;
    absentDays = attendance.filter(a => a.status === 'absent').length;
    lateDays = attendance.filter(a => a.status === 'late').length;
    excusedDays = attendance.filter(a => a.status === 'excused').length;

    // Rate is (Present + Late) / Total
    const positiveDays = presentDays + lateDays;
    rate = ((positiveDays / totalDays) * 100).toFixed(0) + '%';
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>My Attendance Logs</h1>
        <p>Check your daily attendance sheets and overall rate statistics.</p>
      </div>

      {/* Attendance Stats Cards */}
      <div className="dashboard-grid">
        {/* Attendance Rate */}
        <div className="card card-hover animate-slide-up stagger-1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance Rate</span>
            <div className="stat-icon stat-icon-indigo">
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem', lineHeight: 1 }}>{rate}</div>
          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>Target: &ge; 90%</span>
        </div>

        {/* Present / Late Days */}
        <div className="card card-hover animate-slide-up stagger-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Present / Late Days</span>
            <div className="stat-icon stat-icon-emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem', lineHeight: 1, color: 'hsl(var(--accent-emerald-text))' }}>
            {presentDays + lateDays} <span style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>/ {totalDays}</span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
            {presentDays} present, {lateDays} late
          </span>
        </div>

        {/* Absent / Excused Days */}
        <div className="card card-hover animate-slide-up stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Absent / Excused Days</span>
            <div className="stat-icon stat-icon-rose">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem', lineHeight: 1, color: 'hsl(var(--accent-rose-text))' }}>
            {absentDays} <span style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>absent</span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
            {excusedDays} excused absences
          </span>
        </div>
      </div>

      {/* Roster History Table */}
      <div className="card animate-slide-up stagger-4">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
            <Calendar size={18} />
          </div>
          Daily Roster History
        </h3>

        <div className="table-container">
          {attendance && attendance.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Classroom Section</th>
                  <th>Attendance Status</th>
                  <th>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>
                      {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td>{record.classes?.name}</td>
                    <td>
                      <span className={`badge ${
                        record.status === 'present' ? 'badge-success' :
                        record.status === 'late' ? 'badge-warning' :
                        record.status === 'absent' ? 'badge-danger' : 'badge-secondary'
                      }`} style={{ textTransform: 'capitalize' }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                      {record.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar size={24} />
              </div>
              <p>No attendance logs found on your account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
