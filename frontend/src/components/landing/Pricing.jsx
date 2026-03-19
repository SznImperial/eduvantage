import React from 'react';
import { Check } from 'lucide-react';

const Pricing = () => {
  const tiers = [
    { name: 'Basic', price: '50k', desc: 'Perfect for small nursery & primary schools.', features: ['Up to 150 students', 'Student Management', 'Attendance Tracking', 'Email Support'], cta: 'Start Basic' },
    { name: 'Pro', price: '120k', desc: 'Ideal for growing secondary schools.', features: ['Up to 500 students', 'Everything in Basic', 'Paystack Integration', 'Priority Phone Support'], cta: 'Start Pro', popular: true },
    { name: 'Enterprise', price: '250k', desc: 'For large institutions or group of schools.', features: ['Unlimited students', 'Everything in Pro', 'Custom Domain', 'Dedicated Account Manager'], cta: 'Contact Sales' }
  ];

  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Pricing</span>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-desc">Choose the perfect plan for your school's needs. All plans are billed monthly in Naira (₦).</p>
        </div>
        <div className="pricing-grid">
          {tiers.map((t, i) => (
            <div className={`pricing-card ${t.popular ? 'popular' : ''}`} key={i}>
              {t.popular && <span className="popular-badge">Most Popular</span>}
              <h3 className="pricing-name">{t.name}</h3>
              <p className="pricing-desc">{t.desc}</p>
              <div className="pricing-price">
                <span className="amount">₦{t.price}</span>
                <span className="period">/mo</span>
              </div>
              <ul className="pricing-features">
                {t.features.map((f, j) => (
                  <li key={j}><Check size={20} />{f}</li>
                ))}
              </ul>
              <button className={`btn cursor-pointer ${t.popular ? 'btn-primary' : 'btn-secondary'}`}>{t.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
