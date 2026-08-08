'use client';

import React, { useState, useTransition } from 'react';
import { loginUser, createPasswordResetRequestAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import AuthCard from '@/components/ui/AuthCard';
import AlertBanner from '@/components/ui/AlertBanner';

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
      <AuthCard
        title={isResetMode ? 'Reset Password' : 'Sign in to IMP3RIAL EDU'}
        subtitle={isResetMode ? 'Enter your email and full name to request a password reset' : 'Enter your email and password to access your portal'}
      >
        {error && <AlertBanner variant="error" message={error} className="mb-md" />}
        {success && <AlertBanner variant="success" message={success} className="mb-lg" />}

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
            <div className="form-group mb-xl">
              <div className="flex justify-between items-center">
                <label className="form-label" htmlFor="password">Password</label>
                <button
                  type="button"
                  className="btn-ghost text-xs font-medium"
                  onClick={() => { setIsResetMode(true); setError(''); setSuccess(''); }}
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
            className="btn btn-primary w-full"
            type="submit"
            disabled={isPending}
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

        <div className="mt-xl text-center text-sm text-muted">
          {isResetMode ? (
            <button
              type="button"
              className="btn-ghost font-bold"
              onClick={() => { setIsResetMode(false); setError(''); }}
            >
              Back to Sign In
            </button>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-foreground">
                Register your school
              </Link>
            </>
          )}
        </div>
      </AuthCard>
    </div>
  );
}
