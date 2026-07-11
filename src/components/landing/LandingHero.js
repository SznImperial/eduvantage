import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Users, Zap } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="hero-immersive relative overflow-hidden px-lg">
      {/* Dynamic Background Gradients */}
      <div className="hero-orb hero-orb-lg" />
      <div className="hero-orb hero-orb-md" />
      <div className="hero-orb hero-orb-sm animate-float" />

      <div className="container max-w-hero relative z-10">
        <div className="hero-grid">
          
          {/* Left Column: Copy & Actions */}
          <div className="flex flex-col items-start gap-md">
            <div className="animate-fade-in badge-pill mb-sm">
              <Sparkles size={14} />
              A Complete Academic Management Platform
            </div>
            
            <h1 className="animate-slide-up text-hero mb-sm">
              School management,<br />
              <span className="hero-gradient-text">
                beautifully simplified.
              </span>
            </h1>

            <p className="animate-slide-up stagger-2 text-hero-subtitle mb-xl">
              EduVantage unites directors, educators, students, and parents in one high-performance workspace. 
              Manage enrollments, automate grading compilation, and record attendance with premium security.
            </p>

            <div className="animate-slide-up stagger-3 flex flex-wrap gap-sm w-full">
              <Link href="/register" className="btn btn-primary btn-pill">
                Register Your Institution
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn btn-outline btn-pill">
                Portal Login
              </Link>
            </div>
          </div>

          {/* Right Column: Floating perspective dashboard mockup */}
          <div className="animate-fade-in stagger-2 hero-mockup-wrapper">
            <div className="hero-mockup-frame">
              <img 
                src="/eduvantage_dashboard_mockup.png" 
                alt="EduVantage Premium School Dashboard Mockup" 
                className="hero-mockup-img"
              />
            </div>

            {/* Floating badges with realistic SaaS info */}
            <div className="floating-badge floating-badge-1">
              <Users size={18} style={{ color: 'hsl(var(--primary))' }} />
              <div>
                <span>350+ Schools</span>
                <p>Onboarded Network</p>
              </div>
            </div>

            <div className="floating-badge floating-badge-2">
              <ShieldCheck size={18} style={{ color: 'hsl(var(--primary))' }} />
              <div>
                <span>100% Data Privacy</span>
                <p>Isolated Records</p>
              </div>
            </div>

            <div className="floating-badge floating-badge-3">
              <Zap size={18} style={{ color: 'hsl(var(--primary))' }} />
              <div>
                <span>Automated Transcripts</span>
                <p>Instant term sheets</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
