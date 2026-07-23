'use client';

import React, { useState, useTransition } from 'react';
import { signUpSchool } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import AuthCard from '@/components/ui/AuthCard';
import AlertBanner from '@/components/ui/AlertBanner';

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
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    });
  };

  return (
    <div className="auth-container">
      <AuthCard
        title="Create Your School Workspace"
        subtitle="Set up your admin portal and workspace in seconds"
        wide={true}
      >
        {error && <AlertBanner variant="error" message={error} className="mb-md" />}
        {success && <AlertBanner variant="success" message="School registered! Please check your email for a confirmation link." className="mb-lg" />}

        <form onSubmit={handleSubmit}>


          <div className="badge-pill mb-md">
            <span className="badge-number">1</span>
            School Details
          </div>

          <div className="grid-auto-fit mb-xl">
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
                pattern="^[a-z0-9-]+$"
                title="Subdomain slug can only contain lowercase letters, numbers, and hyphens."
                required
                disabled={isPending || success}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="schoolType">School Operations Type</label>
              <select
                className="input"
                id="schoolType"
                name="schoolType"
                required
                disabled={isPending || success}
              >
                <option value="secondary">Secondary School (Subject Teachers)</option>
                <option value="primary">Primary School (Class Teachers)</option>
                <option value="both">Both Primary & Secondary</option>
              </select>
            </div>
          </div>

          <div className="badge-pill mb-md">
            <span className="badge-number">2</span>
            Administrator Details
          </div>

          <div className="grid-auto-fit mb-sm">
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

          <div className="form-group mb-xl">
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
            className="btn btn-primary w-full"
            type="submit"
            disabled={isPending || success}
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

        <div className="mt-xl text-center text-sm text-muted">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-foreground">
            Sign in
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
