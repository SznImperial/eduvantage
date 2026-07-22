'use client';

import React from 'react';
import { Award, BookOpen, FileText, CheckCircle, CalendarDays, BrainCircuit } from 'lucide-react';

export default function TeacherProfileCard({ profile, metrics }) {
  // Badge Logic
  let badgeName = "Needs Engagement";
  let badgeColor = "var(--danger)";
  
  if (metrics.notesUploaded > 10 && metrics.assignmentsGiven > 5 && metrics.lastAttendanceMarked) {
    badgeName = "Master Educator";
    badgeColor = "var(--primary)";
  } else if (metrics.notesUploaded > 0 || metrics.assignmentsGiven > 0) {
    badgeName = "Active Teacher";
    badgeColor = "var(--success)";
  }

  const formatLastDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="card fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-muted" style={{ margin: 0 }}>
            {profile.email} • Staff ID: {profile.id.split('-')[0]}
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
              <BookOpen size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Notes Uploaded</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.notesUploaded}</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.5rem', borderRadius: '8px' }}>
              <FileText size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Assignments Given</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{metrics.assignmentsGiven}</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)', padding: '0.5rem', borderRadius: '8px' }}>
              <CalendarDays size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Last Attendance</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{formatLastDate(metrics.lastAttendanceMarked)}</p>
        </div>

        <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '8px' }}>
              <BrainCircuit size={20} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Last CBT Test</h4>
          </div>
          <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{formatLastDate(metrics.lastCbtOrganized)}</p>
        </div>
      </div>
    </div>
  );
}
