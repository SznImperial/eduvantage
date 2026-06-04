'use client';

import React, { useState, useTransition } from 'react';
import { loginUser } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await loginUser(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
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
            Sign in to EduVantage
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            Enter your email and password to access your portal
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <ShieldAlert size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">Password</label>
            </div>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isPending}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
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
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'hsl(var(--accent-indigo-text))', fontWeight: 600 }}>
            Register your school
          </Link>
        </div>
      </div>
    </div>
  );
}
