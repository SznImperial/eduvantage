'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabaseClient';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  Loader2, 
  Database,
  ArrowRight,
  TrendingUp,
  Calendar,
  Clock,
  Receipt,
  ExternalLink,
  XCircle
} from 'lucide-react';

export default function AdminBillingPage() {
  const supabase = createClient();
  const [school, setSchool] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('annual');
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingTier, setProcessingTier] = useState(null);

  // Check for payment callback status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const tier = params.get('tier');
    const cycle = params.get('cycle');
    const msg = params.get('msg');

    if (paymentStatus === 'success') {
      setSuccess(`Payment successful! Your ${tier} plan (${cycle}) is now active.`);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/admin/billing');
    } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
      setError(msg ? decodeURIComponent(msg) : 'Payment was not completed. Please try again.');
      window.history.replaceState({}, '', '/dashboard/admin/billing');
    }
  }, []);

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

    // 4. Fetch payment history
    const { data: payments } = await supabase
      .from('payment_history')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(10);

    setSchool(schoolData);
    setStudentCount(sCount || 0);
    setClassCount(cCount || 0);
    setPaymentHistory(payments || []);
    if (schoolData?.billing_cycle) {
      setBillingCycle(schoolData.billing_cycle);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpgrade = async (tier) => {
    if (!school) return;
    setError('');
    setSuccess('');
    setProcessingTier(tier);

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingCycle }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to initialize payment.');
        setProcessingTier(null);
        return;
      }

      // Redirect to Paystack checkout using Inline Popup
      if (data.access_code) {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          access_code: data.access_code,
          onClose: function() {
            setProcessingTier(null);
            setError('Payment was cancelled.');
          },
          callback: function(response) {
            // Success! Safely redirect to our verifier using standard local navigation
            window.location.href = `/api/paystack/verify?reference=${response.reference}`;
          }
        });
        handler.openIframe();
      } else if (data.authorization_url) {
        // Fallback for older standard checkout format
        window.location.href = data.authorization_url;
      } else {
        setError('No payment URL received. Please try again.');
        setProcessingTier(null);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setProcessingTier(null);
    }
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
  const currentBillingCycle = school?.billing_cycle || null;
  const periodEnd = school?.current_period_end ? new Date(school.current_period_end) : null;

  // Percentages for usage bars
  const studentPct = Math.min((studentCount / studentLimit) * 100, 100);
  const classPct = Math.min((classCount / classLimit) * 100, 100);

  // Pricing in display format
  const pricing = {
    starter:    { monthly: '₦40,000',    annual: '₦450,000',   monthlySave: '₦30,000' },
    growth:     { monthly: '₦60,000',    annual: '₦700,000',   monthlySave: '₦20,000' },
    enterprise: { monthly: '₦110,000',   annual: '₦1,300,000', monthlySave: '₦20,000' },
  };

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
      price: billingCycle === 'monthly' ? pricing.starter.monthly : pricing.starter.annual,
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      description: 'Perfect for small tutorial centers and micro-schools.',
      features: ['Up to 100 students', 'Up to 10 classes', 'Prioritized database performance', 'All features included', 'Email support'],
      limitText: '100 Students / 10 Classes limit'
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      price: billingCycle === 'monthly' ? pricing.growth.monthly : pricing.growth.annual,
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      description: 'Best fit for established primary & secondary schools.',
      features: ['Up to 500 students', 'Up to 40 classes', 'High resource allocation', 'SSO & Multi-roles support', '24/7 Priority assistance'],
      limitText: '500 Students / 40 Classes limit',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: billingCycle === 'monthly' ? pricing.enterprise.monthly : pricing.enterprise.annual,
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      description: 'Designed for school districts & large academies.',
      features: ['Unlimited students', 'Unlimited classes', 'Dedicated support manager', 'API access integrations', '99.99% SLA guarantee'],
      limitText: 'Unlimited student capacity'
    }
  ];

  // Tier order for upgrade/downgrade detection
  const tierOrder = { free: 0, starter: 1, growth: 2, enterprise: 3 };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
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
              <span className="badge badge-indigo" style={{ fontWeight: 600 }}>
                {school?.subscription_status === 'past_due' ? 'Past Due' : school?.subscription_status === 'canceled' ? 'Canceled' : 'Active'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '1rem' }}>
              Your workspace is running on the <strong>{currentTier} plan</strong>.
              {currentBillingCycle && ` Billed ${currentBillingCycle}ly.`}
            </p>

            {/* Renewal info */}
            {periodEnd && currentTier !== 'free' && (
              <div style={{ 
                display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem',
                padding: '0.625rem 0.875rem', backgroundColor: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem'
              }}>
                <Calendar size={14} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                <span>
                  {periodEnd > new Date() ? (
                    <>Renews on <strong>{periodEnd.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>
                  ) : (
                    <span style={{ color: 'hsl(var(--destructive))' }}>Subscription expired on {periodEnd.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  )}
                </span>
              </div>
            )}
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

      {/* Billing cycle toggle + Pricing plans */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>Available Plans</h2>
      
      {/* Monthly / Annual Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'hsl(var(--muted))',
          borderRadius: '9999px',
          padding: '4px',
          gap: '2px',
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: billingCycle === 'monthly' ? 'hsl(var(--card))' : 'transparent',
              color: billingCycle === 'monthly' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              boxShadow: billingCycle === 'monthly' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: billingCycle === 'annual' ? 'hsl(var(--card))' : 'transparent',
              color: billingCycle === 'annual' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              boxShadow: billingCycle === 'annual' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Annual
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'hsl(var(--accent-emerald))',
              color: 'hsl(var(--accent-emerald-text))',
            }}>
              Save more
            </span>
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        alignItems: 'stretch'
      }}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const isDowngrade = tierOrder[plan.id] < tierOrder[currentTier];
          const isProcessing = processingTier === plan.id;
          const isPaidPlan = plan.id !== 'free';

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
                
                {/* Show savings on annual */}
                {isPaidPlan && billingCycle === 'annual' && pricing[plan.id] && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'hsl(var(--accent-emerald) / 0.15)',
                    color: 'hsl(var(--accent-emerald-text))',
                  }}>
                    Save {pricing[plan.id].monthlySave}/yr vs monthly
                  </span>
                )}
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
                style={{ width: '100%', justifySelf: 'flex-end', gap: '0.375rem' }}
                disabled={isCurrent || isPending || isProcessing || plan.id === 'free'}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Redirecting to Paystack...
                  </>
                ) : isCurrent ? (
                  'Current Plan'
                ) : plan.id === 'free' ? (
                  'Free Tier'
                ) : (
                  <>
                    {isDowngrade ? 'Switch Plan' : 'Upgrade'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="card" style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Receipt size={18} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Payment History</h3>
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Cycle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {payment.paid_at 
                        ? new Date(payment.paid_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'
                      }
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{payment.subscription_tier}</span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{payment.billing_cycle}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₦{(payment.amount / 100).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${payment.status === 'success' ? 'badge-primary' : payment.status === 'failed' ? 'badge-ghost' : 'badge-secondary'}`} 
                            style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {payment.status === 'success' && <CheckCircle size={10} />}
                        {payment.status === 'failed' && <XCircle size={10} />}
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>
                        {payment.paystack_reference?.slice(0, 16)}...
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
