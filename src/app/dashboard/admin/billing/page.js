'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { updateSubscriptionAction } from '@/app/actions';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  Loader2, 
  Database,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function AdminBillingPage() {
  const supabase = createClient();
  const [school, setSchool] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBillingData = async () => {
    setLoading(true);
    // 1. Get user profile school ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) return;

    // 2. Fetch School subscription parameters
    const { data: schoolData } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single();

    // 3. Fetch current counts in the tenant
    const { count: sCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .eq('role', 'student');

    const { count: cCount } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', profile.school_id);

    setSchool(schoolData);
    setStudentCount(sCount || 0);
    setClassCount(cCount || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpgrade = async (tier) => {
    if (!school) return;
    setError('');
    setSuccess('');
    startTransition(async () => {
      const res = await updateSubscriptionAction(school.id, tier);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(`Plan successfully changed to ${tier}! Limits updated.`);
        fetchBillingData();
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
        <Loader2 className="animate-spin" />
        <span>Loading subscription status...</span>
      </div>
    );
  }

  const currentTier = school?.subscription_tier || 'free';
  const studentLimit = school?.max_student_limit || 10;
  const classLimit = school?.max_class_limit || 3;

  // Percentages for usage bars
  const studentPct = Math.min((studentCount / studentLimit) * 100, 100);
  const classPct = Math.min((classCount / classLimit) * 100, 100);

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: '₦0',
      period: '',
      description: 'Ideal for evaluating features or small pilot programs.',
      features: ['Up to 10 students', 'Up to 3 classes', 'Standard academic grades', 'Daily attendance logs', 'Announcements billboard'],
      limitText: '10 Students / 3 Classes limit'
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '₦150,000',
      period: '/ year',
      description: 'Perfect for small tutorial centers and micro-schools.',
      features: ['Up to 50 students', 'Up to 10 classes', 'Prioritized database performance', 'All features included', 'Email support'],
      limitText: '50 Students / 10 Classes limit'
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      price: '₦450,000',
      period: '/ year',
      description: 'Best fit for established primary & secondary schools.',
      features: ['Up to 500 students', 'Up to 40 classes', 'High resource allocation', 'SSO & Multi-roles support', '24/7 Priority assistance'],
      limitText: '500 Students / 40 Classes limit',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '₦1,200,000',
      period: '/ year',
      description: 'Designed for school districts & large academies.',
      features: ['Unlimited students', 'Unlimited classes', 'Dedicated support manager', 'API access integrations', '99.99% SLA guarantee'],
      limitText: 'Unlimited student capacity'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>Subscription & Billing</h1>
        <p>Monitor school capacity limits, upgrade plans, and manage platform invoices.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Subscription overview & Usage meters */}
      <div className="responsive-grid-2-1" style={{ marginBottom: '2.5rem', alignItems: 'stretch' }}>
        
        {/* Current plan card */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Subscription</span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'capitalize', marginTop: '0.125rem' }}>{currentTier} Plan</h2>
              </div>
              <span className="badge badge-indigo" style={{ fontWeight: 600 }}>Active</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Your workspace is running on the <strong>{currentTier} plan</strong>. Monthly charges will be billed to your registered payment method.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem' }}>
            <Database size={15} />
            <span>Multi-Tenant DB Shard ID: {school?.id}</span>
          </div>
        </div>

        {/* Live usage limits */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Resource Consumption</h3>
          
          {/* Students progress */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.375rem', fontWeight: 550 }}>
              <span style={{ color: 'hsl(var(--foreground))' }}>Student Accounts</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{studentCount} / {studentLimit === 9999 ? 'Unlimited' : studentLimit}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'hsl(var(--muted))', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${studentPct}%`, 
                backgroundColor: studentPct >= 90 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                borderRadius: '999px',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
          </div>

          {/* Classes progress */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.375rem', fontWeight: 550 }}>
              <span style={{ color: 'hsl(var(--foreground))' }}>Active Classes</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{classCount} / {classLimit === 99 ? 'Unlimited' : classLimit}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'hsl(var(--muted))', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${classPct}%`, 
                backgroundColor: classPct >= 90 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                borderRadius: '999px',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing plans selector */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>Available Upgrades</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        alignItems: 'stretch'
      }}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div 
              key={plan.id} 
              className="card" 
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: plan.popular ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                position: 'relative',
                boxShadow: plan.popular ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
              }}
            >
              {plan.popular && (
                <span style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Sparkles size={10} /> Popular
                </span>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.75rem 0 0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>{plan.price}</span>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.45 }}>{plan.description}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem', flex: 1 }}>
                {plan.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                    <Check size={14} style={{ color: 'hsl(var(--success))', marginTop: '0.125rem', flexShrink: 0 }} />
                    <span style={{ color: 'hsl(var(--foreground) / 0.85)' }}>{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`btn ${isCurrent ? 'btn-ghost' : plan.popular ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', justifySelf: 'flex-end' }}
                disabled={isCurrent || isPending}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  'Select Tier'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
