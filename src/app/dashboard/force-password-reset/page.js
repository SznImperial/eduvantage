'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePasswordAction, logoutUser } from '@/app/actions';
import AuthCard from '@/components/ui/AuthCard';
import AlertBanner from '@/components/ui/AlertBanner';
import { Loader2 } from 'lucide-react';

export default function ForcePasswordResetPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      setSuccess('Password updated successfully! Unlocking your dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <div className="auth-container">
      <AuthCard
        title="Action Required: Reset Password"
        subtitle="Because your account was created via administrative onboarding, security policies require you to set a personal password before proceeding."
      >
        {error && <AlertBanner variant="error" message={error} className="mb-md" />}
        {success && <AlertBanner variant="success" message={success} className="mb-lg" />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="input"
              type="password"
              required
              placeholder="Enter at least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading || !!success}
            />
          </div>

          <div className="form-group mb-lg">
            <label className="form-label">Confirm New Password</label>
            <input
              className="input"
              type="password"
              required
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !!success}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !!success}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Updating Password...' : 'Save & Continue'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
          >
            Not ready now? Sign out of this account
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
