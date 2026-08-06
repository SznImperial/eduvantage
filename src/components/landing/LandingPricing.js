'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export default function LandingPricing() {
  const [billingCycle, setBillingCycle] = useState('annual');

  const plans = [
    {
      id: 'free',
      name: 'Free Pilot',
      monthlyPrice: '₦0',
      annualPrice: '₦0',
      isFree: true,
      description: 'Evaluate the platform with up to 10 students.',
      limitText: '10 students · 3 classes',
      features: [
        'Up to 10 student accounts',
        'Up to 3 classrooms',
        'Standard grading',
        'Daily attendance',
        'Announcements board',
      ],
      ctaText: 'Start Free Pilot',
    },
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: '₦40,000',
      annualPrice: '₦450,000',
      description: 'For micro-schools and tutorial academies.',
      limitText: '100 students · 10 classes',
      features: [
        'Up to 100 student accounts',
        'Up to 10 classrooms',
        'All Free Pilot features',
        'Priority performance',
        'Email support',
      ],
      ctaText: 'Choose Starter',
    },
    {
      id: 'growth',
      name: 'Growth School',
      monthlyPrice: '₦60,000',
      annualPrice: '₦700,000',
      description: 'For established primary and secondary schools.',
      limitText: '500 students · 40 classes',
      features: [
        'Up to 500 student accounts',
        'Up to 40 classrooms',
        'Proctored CBT exam engine',
        'Parent portal access',
        'Priority support',
      ],
      ctaText: 'Choose Growth',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network',
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
      ctaText: 'Contact Sales',
    },
  ];

  return (
    <section id="pricing" className="py-5xl px-lg bg-card border-b border-border">
      <div className="container">
        <div className="text-center mb-3xl">
          <span className="executive-badge mb-sm">
            <span className="gold-dot" />
            <span>Transparent Licensing</span>
          </span>
          <h2 className="text-section-title mb-sm text-foreground">
            Simple, Transparent School Pricing
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto text-muted-foreground font-normal">
            Choose a plan that matches your school&apos;s scale. Every plan includes row-level multi-tenant database privacy.
          </p>
        </div>

        <div className="flex justify-center mb-2xl">
          <div className="billing-toggle p-xs bg-secondary rounded border border-border" role="group" aria-label="Billing cycle">
            <button
              type="button"
              className={`billing-toggle-btn font-bold text-xs ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              className={`billing-toggle-btn font-bold text-xs ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual Billing
              {billingCycle === 'annual' && (
                <span className="billing-save-badge font-extrabold text-xs">Save More</span>
              )}
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card executive-card bg-card ${plan.popular ? 'pricing-card-popular border-2 border-primary' : ''}`}
            >
              {plan.popular && (
                <span className="pricing-popular-badge font-bold">
                  <Sparkles size={12} /> Recommended
                </span>
              )}

              <div className="pricing-plan-header">
                <span className="pricing-plan-name text-foreground font-bold">{plan.name}</span>
                <div className="pricing-plan-price-wrapper">
                  <span className="pricing-plan-price text-foreground font-black">
                    {plan.isFree
                      ? '₦0'
                      : billingCycle === 'monthly'
                        ? plan.monthlyPrice
                        : plan.annualPrice}
                  </span>
                  {!plan.isFree && (
                    <span className="pricing-plan-period text-muted-foreground font-medium">
                      {billingCycle === 'monthly' ? '/ month' : '/ year'}
                    </span>
                  )}
                </div>
                <p className="pricing-plan-desc text-muted-foreground text-xs">{plan.description}</p>
              </div>

              <div className="pricing-plan-limits font-semibold text-xs text-primary bg-secondary px-xs py-1 rounded mb-md text-center">
                {plan.limitText}
              </div>

              <ul className="pricing-features-list">
                {plan.features.map((feat) => (
                  <li key={feat} className="pricing-feature-item text-xs text-foreground">
                    <Check size={14} className="pricing-feature-check text-emerald-600 shrink-0" strokeWidth={2.5} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} w-full font-bold justify-center py-md`}
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
