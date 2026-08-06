'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Building2 } from 'lucide-react';

export default function LandingCtaBanner() {
  return (
    <section className="py-5xl px-lg bg-muted/40">
      <div className="container max-w-hero">
        <div className="executive-card p-2xl sm:p-3xl text-primary-foreground bg-primary text-center border-none shadow-xl">
          <div className="max-w-subtitle mx-auto">
            <span className="inline-flex items-center gap-xs px-md py-xs rounded text-xs font-extrabold uppercase tracking-wider mb-md bg-white/15 text-white backdrop-blur-sm">
              <Building2 size={14} /> Modernize Your Institution Today
            </span>

            <h2 className="text-3xl sm:text-4xl font-black mb-md tracking-tight leading-tight text-white">
              Ready to Save 60% &amp; Modernize Academic Operations?
            </h2>

            <p className="text-base sm:text-lg opacity-95 mb-xl leading-relaxed font-normal text-slate-200">
              Join forward-thinking school principals and directors using EduVantage to streamline academic administration, automate gradebooks, and conduct proctored CBT exams.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-md mb-lg">
              <Link
                href="/register"
                className="btn btn-pill bg-white text-slate-900 hover:bg-slate-100 font-bold px-xl py-md text-base justify-center shadow-md"
              >
                Start 14-Day Free Pilot
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="btn btn-pill bg-white/15 text-white hover:bg-white/25 font-semibold px-xl py-md text-base justify-center"
              >
                Sign In to Portal
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-lg text-xs opacity-90 pt-md border-t border-white/20 font-medium text-slate-200">
              <span className="flex items-center gap-xs">
                <ShieldCheck size={14} className="text-amber-400" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-xs">
                <ShieldCheck size={14} className="text-amber-400" /> Setup Completed In &lt; 2 Hours
              </span>
              <span className="flex items-center gap-xs">
                <ShieldCheck size={14} className="text-amber-400" /> Row-Level Encrypted Isolation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
