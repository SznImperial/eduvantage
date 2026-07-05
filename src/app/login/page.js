'use client';

import React, { useState, useTransition } from 'react';
import { loginUser, createPasswordResetRequestAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      if (isResetMode) {
        const result = await createPasswordResetRequestAction(
          formData.get('email'),
          formData.get('fullName')
        );
        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess('Password reset requested successfully. An admin will review it.');
          setIsResetMode(false);
        }
      } else {
        const result = await loginUser(null, formData);
        if (result?.error) {
          setError(result.error);
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="card auth-card glass-panel animate-scale-in" style={{ boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'var(--avatar-gradient)',
            padding: '0.875rem',
            borderRadius: '16px',
            marginBottom: '1rem',
            color: 'hsl(var(--accent-indigo-text))'
          }}>
            <GraduationCap size={30} />
          </div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            {isResetMode ? 'Reset Password' : 'Sign in to EduVantage'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
            {isResetMode ? 'Enter your email and full name to request a password reset' : 'Enter your email and password to access your portal'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <ShieldAlert size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--success-bg, #ecfdf5)', color: 'var(--success-text, #065f46)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={15} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isResetMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                className="input"
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                required={isResetMode}
                disabled={isPending}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              placeholder="name@school.edu"
              required
              disabled={isPending}
            />
          </div>

          {!isResetMode && (
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
                <button
                  type="button"
                  onClick={() => { setIsResetMode(true); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'hsl(var(--accent-indigo-text))', cursor: 'pointer', fontWeight: 500 }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required={!isResetMode}
                disabled={isPending}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isPending}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isResetMode ? 'Submitting...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isResetMode ? 'Request Reset' : 'Sign In'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'hsl(var(--muted-foreground))'
        }}>
          {isResetMode ? (
            <button
              type="button"
              onClick={() => { setIsResetMode(false); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-indigo-text))', cursor: 'pointer', fontWeight: 600 }}
            >
              Back to Sign In
            </button>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: 'hsl(var(--accent-indigo-text))', fontWeight: 600 }}>
                Register your school
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
