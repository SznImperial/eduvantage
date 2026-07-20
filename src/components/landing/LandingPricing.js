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
      description: 'Evaluate the platform with a small pilot.',
      limitText: '10 students · 3 classes',
      features: [
        'Up to 10 student accounts',
        'Up to 3 classrooms',
        'Standard grading',
        'Daily attendance',
        'Announcements board',
      ],
      ctaText: 'Start free trial',
    },
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: '₦40,000',
      annualPrice: '₦450,000',
      description: 'For tutorial centers and micro-schools.',
      limitText: '100 students · 10 classes',
      features: [
        'Up to 100 student accounts',
        'Up to 10 classrooms',
        'All Free Trial features',
        'Priority performance',
        'Email support',
      ],
      ctaText: 'Choose Starter',
    },
    {
      id: 'growth',
      name: 'Growth',
      monthlyPrice: '₦60,000',
      annualPrice: '₦700,000',
      description: 'For established primary and secondary schools.',
      limitText: '500 students · 40 classes',
      features: [
        'Up to 500 student accounts',
        'Up to 40 classrooms',
        'CBT exam engine',
        'Parent portal access',
        'Priority support',
      ],
      ctaText: 'Choose Growth',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: '₦110,000',
      annualPrice: '₦1,300,000',
      description: 'For large academies and school networks.',
      limitText: 'Unlimited capacity',
      features: [
        'Unlimited students & classes',
        'Dedicated database instance',
        'Custom API access',
        '99.99% SLA',
        'Dedicated onboarding',
      ],
      ctaText: 'Contact sales',
    },
  ];

  return (
    <section id="pricing" className="py-5xl px-lg">
      <div className="container">
        <div className="text-center mb-3xl">
          <span className="badge-pill mb-sm">Pricing</span>
          <h2 className="text-section-title mb-sm">
            Simple, transparent plans
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto">
            Choose a plan that matches your school&apos;s scale. Every plan includes secure multi-tenant isolation.
          </p>
        </div>

        <div className="flex justify-center mb-2xl">
          <div className="billing-toggle" role="group" aria-label="Billing cycle">
            <button
              type="button"
              className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`billing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              {billingCycle === 'annual' && (
                <span className="billing-save-badge">Save more</span>
              )}
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}
            >
              {plan.popular && (
                <span className="pricing-popular-badge">
                  <Sparkles size={10} /> Most popular
                </span>
              )}

              <div className="pricing-plan-header">
                <span className="pricing-plan-name">{plan.name}</span>
                <div className="pricing-plan-price-wrapper">
                  <span className="pricing-plan-price">
                    {plan.isFree
                      ? '₦0'
                      : billingCycle === 'monthly'
                        ? plan.monthlyPrice
                        : plan.annualPrice}
                  </span>
                  {!plan.isFree && (
                    <span className="pricing-plan-period">
                      {billingCycle === 'monthly' ? '/ month' : '/ year'}
                    </span>
                  )}
                </div>
                <p className="pricing-plan-desc">{plan.description}</p>
              </div>

              <div className="pricing-plan-limits">{plan.limitText}</div>

              <ul className="pricing-features-list">
                {plan.features.map((feat) => (
                  <li key={feat} className="pricing-feature-item">
                    <Check size={14} className="pricing-feature-check" strokeWidth={2.25} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} w-full`}
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
