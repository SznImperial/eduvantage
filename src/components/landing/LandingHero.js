'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Calculator, CheckCircle2 } from 'lucide-react';

export default function LandingHero() {
  const [heroPreview, setHeroPreview] = useState('dashboard');

  return (
    <section className="hero-immersive px-lg pt-3xl pb-5xl border-b border-border">
      <div className="container max-w-hero relative z-10">
        <div className="hero-grid items-center gap-2xl">
          <div className="flex flex-col items-start gap-md">
            <div className="executive-badge">
              <span className="gold-dot" />
              <span>Official School Operating System &amp; CBT Engine</span>
            </div>

            <h1 className="text-hero leading-tight font-black text-foreground">
              Consolidate School Administration, Grading &amp; CBT Exams Into <span className="gradient-text">One Secure Platform</span>
            </h1>

            <p className="text-hero-subtitle max-w-hero-text text-base sm:text-lg leading-relaxed font-normal text-muted-foreground">
              Built specifically for principals and school proprietors. Eliminate paper registers, compile term report cards automatically, conduct proctored CBT exams, and reduce overall software expenses by 60%.
            </p>

            <div className="hero-cta-row flex-wrap gap-md w-full sm:w-auto">
              <Link href="/register" className="btn btn-primary btn-pill shadow-md text-base px-lg py-md font-bold">
                Start 14-Day School Pilot
                <ArrowRight size={18} />
              </Link>
              <a href="#calculator" className="btn btn-outline btn-pill text-base px-lg py-md font-semibold">
                <Calculator size={18} className="text-primary" />
                Calculate Institutional Savings
              </a>
            </div>

            <div className="hero-stats mt-lg grid grid-cols-3 gap-md w-full">
              <div className="executive-card p-sm bg-card">
                <span className="hero-stat-value text-primary font-black text-lg sm:text-xl block">60% Savings</span>
                <span className="hero-stat-label text-xs font-medium text-muted-foreground">Consolidated Stack</span>
              </div>
              <div className="executive-card p-sm bg-card">
                <span className="hero-stat-value font-black text-lg sm:text-xl block text-amber-600">Proctored CBT</span>
                <span className="hero-stat-label text-xs font-medium text-muted-foreground">Anti-Cheat Engine</span>
              </div>
              <div className="executive-card p-sm bg-card">
                <span className="hero-stat-value text-foreground font-black text-lg sm:text-xl block">Multi-Tenant</span>
                <span className="hero-stat-label text-xs font-medium text-muted-foreground">Row-Level Isolation</span>
              </div>
            </div>
          </div>

          {/* Executive Visual Preview Frame */}
          <div className="hero-mockup-wrapper w-full">
            <div className="flex justify-center gap-xs mb-sm p-xs rounded border border-border bg-muted/60">
              <button
                type="button"
                className={`hero-tab-btn ${heroPreview === 'dashboard' ? 'active' : ''}`}
                onClick={() => setHeroPreview('dashboard')}
              >
                Command Center
              </button>
              <button
                type="button"
                className={`hero-tab-btn ${heroPreview === 'cbt' ? 'active' : ''}`}
                onClick={() => setHeroPreview('cbt')}
              >
                CBT Anti-Cheat
              </button>
              <button
                type="button"
                className={`hero-tab-btn ${heroPreview === 'fees' ? 'active' : ''}`}
                onClick={() => setHeroPreview('fees')}
              >
                Tuition Recovery
              </button>
            </div>

            <div className="executive-card overflow-hidden border-2 border-border">
              {heroPreview === 'dashboard' && (
                <img
                  src="/imp3rialedu_dashboard_mockup.png"
                  alt="EduVantage school administrative dashboard"
                  className="hero-mockup-img w-full h-auto object-cover"
                />
              )}

              {heroPreview === 'cbt' && (
                <div className="p-xl bg-slate-900 text-slate-100 min-h-[340px] flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-sm">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-xs">
                      <CheckCircle2 size={15} /> PROCTORED EXAMINATION MONITORING ACTIVE
                    </span>
                    <span className="text-xs font-mono text-slate-400">Exam Ref: CBT-MIDTERM-2026</span>
                  </div>
                  <div className="my-lg space-y-sm">
                    <div className="p-md bg-slate-950 rounded border border-slate-800">
                      <div className="text-xs text-slate-400">Student Profile: Senior Secondary 2 (Science)</div>
                      <div className="text-sm font-bold text-white mt-xs">Mathematics &amp; Quantitative Analysis</div>
                    </div>
                    <div className="p-sm bg-emerald-950/60 border border-emerald-500/40 rounded text-xs text-emerald-300 flex items-center justify-between">
                      <span>Proctor Metrics: Zero focus violations detected</span>
                      <span className="font-bold">Automated Scoring Ready</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-center pt-xs border-t border-slate-800 font-medium">
                    Native CBT Engine · Integrated directly into school database
                  </div>
                </div>
              )}

              {heroPreview === 'fees' && (
                <div className="p-xl bg-card text-card-foreground min-h-[340px] flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-border pb-sm">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Bursar Revenue Oversight</span>
                    <span className="badge-pill font-bold bg-secondary text-secondary-foreground">
                      Auto Invoicing
                    </span>
                  </div>
                  <div className="my-lg space-y-md">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs block font-medium text-muted-foreground">Term 2 Total Recovery</span>
                        <span className="text-2xl font-black text-emerald-600">₦18,450,000</span>
                      </div>
                      <span className="text-xs font-bold text-foreground">94.8% Collected</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden bg-muted">
                      <div className="h-full w-[94.8%] bg-primary" />
                    </div>
                  </div>
                  <div className="text-xs text-center pt-xs border-t border-border font-medium text-muted-foreground">
                    Monitor amounts owed vs paid per classroom automatically
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
