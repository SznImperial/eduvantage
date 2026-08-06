'use client';

import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle, Clock, FileText, Percent, BrainCircuit, Edit3, Lock, Shield, User, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateStudentDetailsAction } from '@/app/actions';

export default function StudentProfileCard({ 
  profile, 
  metrics, 
  isAdmin = false, 
  availableClasses = [], 
  initialClassId = '', 
  initialGuardianEmail = '' 
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.first_name || '');
  const [lastName, setLastName] = useState(profile.last_name || '');
  const [classId, setClassId] = useState(initialClassId || '');
  const [guardianEmail, setGuardianEmail] = useState(initialGuardianEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [forceReset, setForceReset] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      class_id: classId || null,
      guardian_email: guardianEmail.trim() || null
    };

    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setLoading(false);
        setError('Password must be at least 6 characters long.');
        return;
      }
      updates.new_password = newPassword.trim();
      updates.must_change_password = forceReset;
    }

    const res = await updateStudentDetailsAction(profile.id, updates);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Student profile and security credentials updated successfully!');
      setIsEditing(false);
      setNewPassword('');
      router.refresh();
    }
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
        padding: 'clamp(1.25rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)', 
        background: 'var(--primary-gradient)',
        color: '#fff',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem, 3vw, 1.5rem)', minWidth: 0, flex: '1 1 220px' }}>
          <div style={{
            width: 'clamp(56px, 12vw, 80px)',
            height: 'clamp(56px, 12vw, 80px)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(1.25rem, 4vw, 2rem)',
            fontWeight: 'bold',
            border: '2px solid rgba(255,255,255,0.4)',
            color: '#fff',
            flexShrink: 0
          }}>
            {firstName[0] || 'S'}{lastName[0] || ''}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.2rem, 4.5vw, 1.75rem)', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', wordBreak: 'break-word' }}>
              {firstName} {lastName}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem', fontSize: '0.875rem', opacity: 0.9 }}>
              <span style={{ wordBreak: 'break-all' }}>{profile.email}</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              <span>Admission No: {profile.admission_no || 'N/A'}</span>
              {guardianEmail && (
                <>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                  <span>Guardian: {guardianEmail}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={() => { setIsEditing(!isEditing); setError(null); setSuccess(null); }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              {isEditing ? <X size={18} /> : <Edit3 size={18} />}
              {isEditing ? 'Cancel Edit' : 'Edit Student & Guardian'}
            </button>
          )}

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
      </div>

      {/* Notifications Bar */}
      {(error || success) && (
        <div style={{
          padding: '1rem 1.5rem',
          background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderBottom: `1px solid ${error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          color: error ? '#f87171' : '#34d399',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error ? `⚠️ ${error}` : `✅ ${success}`}</span>
          <button onClick={() => { setError(null); setSuccess(null); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* Admin Edit Panel */}
      {isAdmin && isEditing && (
        <div style={{ 
          padding: '2rem', 
          background: 'rgba(15, 23, 42, 0.4)', 
          borderBottom: '1px solid var(--border)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} style={{ color: '#3b82f6' }} /> Admin Management & Security Override
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--muted-foreground)' }}>
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--muted-foreground)' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--muted-foreground)' }}>
                  Class Enrollment
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">-- Unenrolled / No Class --</option>
                  {availableClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.grade_level ? `(Grade ${c.grade_level})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--muted-foreground)' }}>
                  Guardian Email (Parent Linking)
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com (or leave empty)"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* Password Reset Section */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.05)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} /> Admin Password Override & Security Gate
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                Set a temporary password to immediately regain access. Toggle forced password reset to prompt the student to pick their own password on next login.
              </p>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <input
                    type="password"
                    placeholder="New password (leave blank if unchanged)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="forceReset"
                    checked={forceReset}
                    onChange={(e) => setForceReset(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="forceReset" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', cursor: 'pointer' }}>
                    Require password change on next login
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-gradient)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Save size={18} />
                {loading ? 'Saving Changes...' : 'Save Profile & Security Policy'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{ padding: 'clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)', background: 'var(--background)' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 600 }}>Performance Dashboard</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', 
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
