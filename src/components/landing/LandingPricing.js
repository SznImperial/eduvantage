import React from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export default function LandingPricing() {
  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: '₦0',
      period: '',
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
      price: '₦150,000',
      period: '/ year',
      description: 'Perfect for tutorial centers and small micro-schools.',
      limitText: '50 Students / 10 Classes limit',
      features: [
        'Up to 50 student accounts',
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
      price: '₦450,000',
      period: '/ year',
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
      price: '₦1,200,000',
      period: '/ year',
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
                  <span className="pricing-plan-price">{plan.price}</span>
                  <span className="pricing-plan-period">{plan.period}</span>
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
                href={`/register?plan=${plan.id}`} 
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
