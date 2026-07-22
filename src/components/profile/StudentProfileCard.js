'use client';

import React from 'react';
import { Award, BookOpen, CheckCircle, Clock, FileText, Percent, BrainCircuit } from 'lucide-react';

export default function StudentProfileCard({ profile, metrics }) {
  // Badge Logic
  let badgeName = "Developing Learner";
  let badgeColor = "var(--danger)";
  
  if (metrics.gradeAverage > 85 && metrics.attendanceRate > 90) {
    badgeName = "Outstanding Scholar (A+)";
    badgeColor = "var(--primary)";
  } else if (metrics.gradeAverage > 70 && metrics.attendanceRate > 75) {
    badgeName = "Consistent Achiever (A)";
    badgeColor = "var(--success)";
  } else if (metrics.gradeAverage >= 60) {
    badgeName = "Good (B)";
    badgeColor = "var(--warning)";
  }

  return (
    <div className="card fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-muted" style={{ margin: 0 }}>
            {profile.email} • Admission No: {profile.admission_no || 'N/A'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: `${badgeColor}15`, color: badgeColor, padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <Award size={18} />
            {badgeName}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
              <Percent size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Grade Average</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.gradeAverage}%</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.5rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Attendance Rate</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.attendanceRate}%</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)', padding: '0.5rem', borderRadius: '8px' }}>
              <BrainCircuit size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>CBT Average</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.cbtAverage}%</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
              <FileText size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Assignments Submitted</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.assignmentsSubmitted}</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.5rem', borderRadius: '8px' }}>
              <CheckCircle size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Notes Completed</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.notesCompleted}</p>
        </div>
      </div>
    </div>
  );
}
