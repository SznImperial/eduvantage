'use client';

import React, { useState, useTransition } from 'react';
import { ShieldAlert, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { deleteSchoolAction } from '@/app/actions';

export default function AdminSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState('');

  const handleDeleteSchool = () => {
    setError('');
    startTransition(async () => {
      const res = await deleteSchoolAction();
      if (res?.error) {
        setError(res.error);
        setShowDeleteModal(false);
      } else {
        // Redirect to login page on success since the user is logged out
        window.location.href = '/login';
      }
    });
  };

  return (
    <div className="dashboard-content">
      <div className="header-section">
        <h1 className="h1">Account Settings</h1>
        <p className="subtitle">Manage your school's data and system preferences.</p>
      </div>

      {error && (
        <div className="banner banner-error" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid hsl(var(--destructive) / 0.2)', backgroundColor: 'hsl(var(--destructive) / 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'hsl(var(--destructive))' }}>
          <ShieldAlert size={20} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Danger Zone</h3>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Delete School & All Data</h4>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', maxWidth: '500px' }}>
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={24} /> Delete School
            </h3>
            
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              You are about to permanently delete your entire school from IMP3RIAL EDU. All data will be wiped immediately and cannot be recovered.
            </p>
            
            <div className="banner banner-warning" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <strong>Warning:</strong> If you have an active Paystack subscription, there will be no refunds for the unused time.
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Type <strong>DELETE</strong> to confirm</label>
              <input 
                className="input" 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
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
                style={{ backgroundColor: 'hsl(var(--destructive))' }}
                disabled={deleteConfirmation !== 'DELETE' || isPending}
                onClick={handleDeleteSchool}
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                ) : (
                  <>Confirm Delete <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
