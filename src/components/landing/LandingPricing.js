'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export default function LandingPricing() {
  const [billingCycle, setBillingCycle] = useState('annual');

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      monthlyPrice: '₦0',
      annualPrice: '₦0',
      isFree: true,
      description: 'Ideal for evaluating features or running a small pilot program.',
      limitText: '10 Students / 3 Classes limit',
      features: [
        'Up to 10 student accounts',
        'Up to 3 active classrooms',
        'Standard grading system',
        'Daily attendance registers',
        'Announcements billboard'
      ],
      ctaText: 'Start Free Trial'
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      monthlyPrice: '₦40,000',
      annualPrice: '₦450,000',
      description: 'Perfect for tutorial centers and small micro-schools.',
      limitText: '100 Students / 10 Classes limit',
      features: [
        'Up to 100 student accounts',
        'Up to 10 active classrooms',
        'All Free Trial features included',
        'Prioritized database performance',
        'Dedicated email support'
      ],
      ctaText: 'Deploy Starter'
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      monthlyPrice: '₦60,000',
      annualPrice: '₦700,000',
      description: 'Best fit for established primary & secondary schools.',
      limitText: '500 Students / 40 Classes limit',
      features: [
        'Up to 500 student accounts',
        'Up to 40 active classrooms',
        'CBT Exam Engine integrated',
        'Parent-Teacher coordination portal',
        '24/7 Priority support access'
      ],
      ctaText: 'Get Growth Plan',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      monthlyPrice: '₦110,000',
      annualPrice: '₦1,300,000',
      description: 'Designed for large academies and school networks.',
      limitText: 'Unlimited student capacity',
      features: [
        'Unlimited student accounts',
        'Unlimited active classrooms',
        'Dedicated database shard instance',
        'Custom API access integrations',
        '99.99% SLA guarantee'
      ],
      ctaText: 'Register Enterprise'
    }
  ];

  return (
    <section id="pricing" className="py-5xl px-lg">
      <div className="container">
        
        {/* Section Header */}
        <div className="text-center mb-3xl">
          <span className="badge-pill mb-sm" style={{ backgroundColor: 'hsl(var(--accent-indigo))', color: 'hsl(var(--accent-indigo-text))' }}>Pricing Plans</span>
          <h2 className="text-section-title mb-sm">
            Simple, transparent billing
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto">
            Select the plan that matches your school's scale. All plans offer secure row-level data isolation.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '9999px',
            padding: '4px',
            gap: '4px',
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.25s ease',
                backgroundColor: billingCycle === 'monthly' ? 'hsl(var(--primary))' : 'transparent',
                color: billingCycle === 'monthly' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.25s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: billingCycle === 'annual' ? 'hsl(var(--primary))' : 'transparent',
                color: billingCycle === 'annual' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              Annual
              {billingCycle === 'annual' && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: 'hsl(var(--accent-emerald))',
                  color: 'hsl(var(--accent-emerald-text))',
                  lineHeight: 1.4,
                  letterSpacing: '0.02em',
                }}>
                  Save more
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}
            >
              {plan.popular && (
                <span className="pricing-popular-badge">
                  <Sparkles size={10} /> Popular Choice
                </span>
              )}

              <div className="pricing-plan-header">
                <span className="pricing-plan-name">{plan.name}</span>
                <div className="pricing-plan-price-wrapper">
                  <span className="pricing-plan-price">
                    {plan.isFree ? '₦0' : billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                  </span>
                  <span className="pricing-plan-period">
                    {plan.isFree ? '' : billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>
                <p className="pricing-plan-desc">{plan.description}</p>
              </div>

              <div className="pricing-plan-limits">
                {plan.limitText}
              </div>

              <ul className="pricing-features-list">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="pricing-feature-item">
                    <Check size={14} className="pricing-feature-check" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href={`/register?plan=${plan.id}&cycle=${billingCycle}`} 
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', marginTop: 'auto' }}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
