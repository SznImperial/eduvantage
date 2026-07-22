'use client';

import React from 'react';
import { Award, BookOpen, FileText, CalendarDays, BrainCircuit } from 'lucide-react';

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
    <div className="fade-in" style={{ 
      background: 'var(--card)', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
    }}>
      {/* Premium Header Profile Section */}
      <div style={{ 
        padding: '3rem 2rem', 
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', // Vibrant indigo/purple gradient
        color: '#fff',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
            border: '2px solid rgba(255,255,255,0.4)',
            color: '#fff'
          }}>
            {profile.first_name[0]}{profile.last_name[0]}
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
              {profile.first_name} {profile.last_name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.95rem', opacity: 0.9 }}>
              <span>{profile.email}</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
              <span>Staff ID: {profile.id.split('-')[0]}</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          padding: '0.75rem 1.5rem',
          borderRadius: '2rem',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ background: '#fff', color: badgeColor, padding: '0.4rem', borderRadius: '50%' }}>
            <Award size={20} strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>{badgeName}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ padding: '2.5rem 2rem', background: 'var(--background)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>Engagement Metrics</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1.25rem' 
        }}>
          
          <MetricCard 
            title="Notes Uploaded" 
            value={metrics.notesUploaded} 
            icon={<BookOpen size={22} />} 
            color="var(--primary)" 
            bg="var(--accent-indigo)" 
          />

          <MetricCard 
            title="Assignments Given" 
            value={metrics.assignmentsGiven} 
            icon={<FileText size={22} />} 
            color="var(--success)" 
            bg="var(--accent-emerald)" 
          />

          <MetricCard 
            title="Last Attendance" 
            value={formatLastDate(metrics.lastAttendanceMarked)} 
            icon={<CalendarDays size={22} />} 
            color="var(--warning)" 
            bg="var(--accent-amber)" 
          />

          <MetricCard 
            title="Last CBT Organized" 
            value={formatLastDate(metrics.lastCbtOrganized)} 
            icon={<BrainCircuit size={22} />} 
            color="var(--destructive)" 
            bg="var(--accent-rose)" 
          />

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, bg }) {
  return (
    <div style={{ 
      background: 'var(--card)', 
      padding: '1.75rem', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          background: bg, 
          color: color, 
          padding: '0.75rem', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>{title}</h4>
      </div>
      <p style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  );
}
