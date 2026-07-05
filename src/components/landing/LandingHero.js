import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="pt-6xl pb-5xl px-lg text-center relative overflow-hidden">
      <div className="hero-orb hero-orb-lg" />
      <div className="hero-orb hero-orb-md" />
      <div className="hero-orb hero-orb-sm animate-float" />

      <div className="container max-w-hero relative z-10">
        <div className="animate-fade-in badge-pill mb-xl">
          <Sparkles size={14} />
          Simple · Secure · Built for Modern Schools
        </div>
        
        <h1 className="animate-slide-up text-hero mb-lg">
          School management,<br />
          <span className="hero-gradient-text">
            beautifully simplified.
          </span>
        </h1>

        <p className="animate-slide-up stagger-2 text-hero-subtitle max-w-hero-text mx-auto mb-2xl">
          EduVantage brings administrators, teachers, and students together in one clean, fast workspace. 
          Take attendance, log grades, and share updates instantly.
        </p>

        <div className="animate-slide-up stagger-3 flex justify-center flex-wrap gap-sm">
          <Link href="/register" className="btn btn-primary btn-pill">
            Create School Workspace
            <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="btn btn-outline btn-pill">
            Access Portal
          </Link>
        </div>
      </div>
    </section>
  );
}
