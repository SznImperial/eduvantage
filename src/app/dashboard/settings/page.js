'use client';

import React, { useState } from 'react';
import { changePasswordAction } from '@/app/actions';
import { Shield, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await changePasswordAction(newPassword);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Your password has been changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '1.5rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Account Settings</h1>
        <p>Manage your account security and update your login password.</p>
      </div>

      <div className="card glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div className="stat-icon stat-icon-indigo" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Security Settings</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Update your account access credentials.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={20} className="shrink-0" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <CheckCircle2 size={20} className="shrink-0" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Key size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.375rem' }}>
              Password must be at least 6 characters.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Key size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            </div>
          </div>

          <button 
            className="btn btn-primary w-full" 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
