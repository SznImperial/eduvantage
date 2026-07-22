import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="hero-immersive px-lg">
      <div className="container max-w-hero relative z-10">
        <div className="hero-grid">
          <div className="flex flex-col items-start gap-md">
            <div className="badge-pill">
              School management platform
            </div>

            <h1 className="text-hero">
              Run your school with clarity and control.
            </h1>

            <p className="text-hero-subtitle max-w-hero-text">
              IMP3RIAL EDU brings administration, teaching, students, and parents
              into one secure workspace — grading, attendance, fees, and exams included.
            </p>

            <div className="hero-cta-row">
              <Link href="/register" className="btn btn-primary btn-pill">
                Register your school
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn btn-outline btn-pill">
                Sign in to portal
              </Link>
            </div>

            <div className="hero-stats mt-md">
              <div className="hero-stat">
                <span className="hero-stat-value">Multi-tenant</span>
                <span className="hero-stat-label">Isolated school data</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">Role-based</span>
                <span className="hero-stat-label">Admin to student access</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">Built-in CBT</span>
                <span className="hero-stat-label">Exams &amp; auto-scoring</span>
              </div>
            </div>
          </div>

          <div className="hero-mockup-wrapper">
            <div className="hero-mockup-frame">
              <img
                src="/imp3rialedu_dashboard_mockup.png"
                alt="IMP3RIAL EDU school dashboard"
                className="hero-mockup-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
