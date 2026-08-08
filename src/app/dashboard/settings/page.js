'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { changePasswordAction, deleteSchoolAction } from '@/app/actions';
import { Shield, Key, AlertCircle, CheckCircle2, ShieldAlert, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Danger Zone state
  const [role, setRole] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    async function getRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) setRole(data.role);
      }
    }
    getRole();
  }, []);

  const handleDeleteSchool = () => {
    setDeleteError('');
    startTransition(async () => {
      const res = await deleteSchoolAction();
      if (res?.error) {
        setDeleteError(res.error);
        setShowDeleteModal(false);
      } else {
        window.location.href = '/login';
      }
    });
  };

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

      {role === 'admin' && (
        <div className="card glass-panel" style={{ padding: '2rem', marginTop: '2rem', border: '1px solid hsl(var(--destructive) / 0.2)', backgroundColor: 'hsl(var(--destructive) / 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'hsl(var(--destructive))' }}>
            <ShieldAlert size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Danger Zone</h3>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Delete School & All Data</h4>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', maxWidth: '500px', margin: 0 }}>
                Permanently delete this school, all teacher and student accounts, attendance records, grades, and payments. This action is irreversible.
              </p>
            </div>
            <button 
              className="btn btn-outline" 
              style={{ borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))' }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} /> Delete School
            </button>
          </div>
          
          {deleteError && (
            <div className="alert alert-error" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <ShieldAlert size={20} className="shrink-0" />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{deleteError}</span>
            </div>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card glass-panel" style={{ maxWidth: '450px', width: '90%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={24} /> Delete School
            </h3>
            
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              You are about to permanently delete your entire school from IMP3RIAL EDU. All data will be wiped immediately and cannot be recovered.
            </p>
            
            <div className="alert" style={{ marginBottom: '1.5rem', fontSize: '0.85rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'rgb(202, 138, 4)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '1rem', borderRadius: '8px' }}>
              <strong>Warning:</strong> If you have an active Paystack subscription, there will be no refunds for the unused time.
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Type <strong>DELETE</strong> to confirm</label>
              <input 
                className="input" 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={isPending}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'hsl(var(--destructive))', color: 'white', border: 'none' }}
                disabled={deleteConfirmation !== 'DELETE' || isPending}
                onClick={handleDeleteSchool}
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Confirm Delete <ArrowRight size={16} /></div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
