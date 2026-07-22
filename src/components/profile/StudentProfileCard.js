'use client';

import React from 'react';
import { Award, BookOpen, CheckCircle, Clock, FileText, Percent, BrainCircuit } from 'lucide-react';

export default function StudentProfileCard({ profile, metrics }) {
  let badgeName = "Poor Learner";
  let badgeLetter = "F";
  let badgeColor = "#dc2626"; // Red
  
  if (metrics.gradeAverage >= 80) {
    badgeName = "Outstanding Scholar";
    badgeLetter = "A";
    badgeColor = "#16a34a"; // Bright Green
  } else if (metrics.gradeAverage >= 70) {
    badgeName = "Consistent Achiever";
    badgeLetter = "B";
    badgeColor = "#84cc16"; // Light Green
  } else if (metrics.gradeAverage >= 60) {
    badgeName = "Good Learner";
    badgeLetter = "C";
    badgeColor = "#eab308"; // Yellow
  } else if (metrics.gradeAverage >= 50) {
    badgeName = "Average Learner";
    badgeLetter = "D";
    badgeColor = "#f97316"; // Orange
  } else if (metrics.gradeAverage >= 40) {
    badgeName = "Developing Learner";
    badgeLetter = "E";
    badgeColor = "#ef4444"; // Red-Orange
  }

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
        background: 'var(--primary-gradient)',
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
              <span>Admission No: {profile.admission_no || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          padding: '0.5rem 1.25rem 0.5rem 0.5rem',
          borderRadius: '2rem',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            background: badgeColor, 
            color: '#fff', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: '900', 
            fontSize: '1.25rem',
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2)'
          }}>
            {badgeLetter}
          </div>
          <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>{badgeName}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ padding: '2.5rem 2rem', background: 'var(--background)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>Performance Dashboard</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1.25rem' 
        }}>
          
          <MetricCard 
            title="Grade Average" 
            value={`${metrics.gradeAverage}%`} 
            icon={<Percent size={22} />} 
            color="var(--primary)" 
            bg="var(--accent-indigo)" 
          />

          <MetricCard 
            title="Attendance Rate" 
            value={`${metrics.attendanceRate}%`} 
            icon={<Clock size={22} />} 
            color="var(--success)" 
            bg="var(--accent-emerald)" 
          />

          <MetricCard 
            title="CBT Average" 
            value={`${metrics.cbtAverage}%`} 
            icon={<BrainCircuit size={22} />} 
            color="var(--warning)" 
            bg="var(--accent-amber)" 
          />

          <MetricCard 
            title="Assignments Submitted" 
            value={metrics.assignmentsSubmitted} 
            icon={<FileText size={22} />} 
            color="var(--accent-violet-text)" 
            bg="var(--accent-violet)" 
          />

          <MetricCard 
            title="Notes Completed" 
            value={metrics.notesCompleted} 
            icon={<CheckCircle size={22} />} 
            color="var(--success)" 
            bg="var(--accent-emerald)" 
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
      <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
        {value}
      </p>
    </div>
  );
}
