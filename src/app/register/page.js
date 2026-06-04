'use client';

import React, { useState, useTransition } from 'react';
import { signUpSchool } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await signUpSchool(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Wait 3 seconds and redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="card auth-card glass-panel animate-scale-in" style={{ maxWidth: '520px', boxShadow: 'var(--shadow-xl)' }}>
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
            Create Your School Workspace
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
            Set up your admin portal and workspace in seconds
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <ShieldAlert size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={15} />
            <span>School registered! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'hsl(var(--accent-indigo-text))',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'var(--primary-gradient)',
              color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 800
            }}>1</span>
            School Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="schoolName">School Name</label>
              <input
                className="input"
                id="schoolName"
                name="schoolName"
                type="text"
                placeholder="Apex Academy"
                required
                disabled={isPending || success}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="schoolSlug">Subdomain Slug</label>
              <input
                className="input"
                id="schoolSlug"
                name="schoolSlug"
                type="text"
                placeholder="apex"
                required
                disabled={isPending || success}
              />
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'hsl(var(--accent-indigo-text))',
            marginTop: '1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'var(--primary-gradient)',
              color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 800
            }}>2</span>
            Administrator Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input
                className="input"
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Jane"
                required
                disabled={isPending || success}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input
                className="input"
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                required
                disabled={isPending || success}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              placeholder="admin@school.edu"
              required
              disabled={isPending || success}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending || success}
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isPending || success}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Create School Tenant
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
          Already registered?{' '}
          <Link href="/login" style={{ color: 'hsl(var(--accent-indigo-text))', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
