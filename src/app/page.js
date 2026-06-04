'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { GraduationCap, ShieldCheck, Database, LayoutGrid, CheckCircle2, UserCheck, BarChart3, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="navbar">
        <div className="nav-logo">
          <GraduationCap size={26} />
          Edu<span>Vantage</span>
        </div>
        <div className="nav-links">
          <Link href="/login" className="nav-link">
            Sign In
          </Link>
          <ThemeToggle />
          <Link href="/register" className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.5rem 1.5rem' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1 }}>
        <section style={{
          padding: '6rem 1.5rem 5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Floating gradient orbs */}
          <div className="hero-orb" style={{
            width: '500px', height: '500px',
            top: '-100px', right: '-100px'
          }} />
          <div className="hero-orb" style={{
            width: '400px', height: '400px',
            bottom: '-80px', left: '-60px'
          }} />
          <div className="hero-orb animate-float" style={{
            width: '200px', height: '200px',
            top: '20%', left: '15%',
            filter: 'blur(40px)'
          }} />

          <div className="container" style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
            <div className="animate-fade-in" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'hsl(var(--accent-indigo))',
              color: 'hsl(var(--accent-indigo-text))',
              padding: '0.4rem 1.125rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              marginBottom: '2rem'
            }}>
              <Sparkles size={14} />
              Simple · Secure · Built for Modern Schools
            </div>
            
            <h1 className="animate-slide-up" style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              marginBottom: '1.5rem',
              color: 'hsl(var(--foreground))'
            }}>
              School management,<br />
              <span className="hero-gradient-text">
                beautifully simplified.
              </span>
            </h1>

            <p className="animate-slide-up stagger-2" style={{
              fontSize: '1.125rem',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '2.5rem',
              lineHeight: 1.7,
              maxWidth: '580px',
              margin: '0 auto 2.5rem'
            }}>
              EduVantage brings administrators, teachers, and students together in one clean, fast workspace. 
              Take attendance, log grades, and share updates instantly.
            </p>

            <div className="animate-slide-up stagger-3" style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn btn-primary" style={{
                padding: '0.8rem 2rem',
                fontSize: '0.9375rem',
                borderRadius: '9999px'
              }}>
                Create School Workspace
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn btn-outline" style={{
                padding: '0.8rem 2rem',
                fontSize: '0.9375rem',
                borderRadius: '9999px'
              }}>
                Access Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Technical Highlights Section */}
        <section style={{ padding: '5rem 1.5rem' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
                Built for the modern classroom
              </h2>
              <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
                A powerful, lightweight tool designed to make school operations effortless and secure.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div className="card card-hover animate-fade-in stagger-1" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div className="feature-icon stat-icon-indigo">
                  <Database size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Complete Data Privacy
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55 }}>
                    Your school&apos;s records are kept completely isolated and secure. 
                    We prioritize student data privacy so you can focus on education.
                  </p>
                </div>
              </div>

              <div className="card card-hover animate-fade-in stagger-2" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div className="feature-icon stat-icon-violet">
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Lightning Fast Performance
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55 }}>
                    Built on next-generation web tech for instant page loads. 
                    Access attendance logs, class schedules, and grades in real-time.
                  </p>
                </div>
              </div>

              <div className="card card-hover animate-fade-in stagger-3" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div className="feature-icon stat-icon-emerald">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Made for Everyone
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55 }}>
                    Tailored portals for administrators, teachers, and students alike. 
                    Intuitive controls mean no extensive training or manuals required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Overview Section */}
        <section style={{ padding: '4rem 1.5rem', backgroundColor: 'hsl(var(--muted) / 0.25)' }}>
          <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '3rem',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
                  Tailored portals for every user
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    <div className="stat-icon stat-icon-indigo" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                      <UserCheck size={18} />
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Administrators configure courses, register classes, and set up user profiles.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    <div className="stat-icon stat-icon-violet" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                      <BarChart3 size={18} />
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Teachers record daily attendance logs and input term scores in seconds.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    <div className="stat-icon stat-icon-emerald" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                      <Users size={18} />
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Students check report cards, view attendance summaries, and stay updated.</span>
                  </div>
                </div>
              </div>

              <div className="card glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: 'hsl(var(--accent-indigo-text))' }} /> Security & Reliability
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', margin: '0.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <span style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>Uptime Guarantee</span>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>99.99%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <span style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>Data Encryption</span>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>AES-256</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>Automated Backups</span>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Daily</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8125rem', marginTop: '1rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.55 }}>
                  Your school records are fully encrypted and backed up daily. We implement multi-layered compliance controls to keep information safe.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2.5rem 1.5rem',
        borderTop: '1px solid hsl(var(--border))',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: 'hsl(var(--muted-foreground))',
        backgroundColor: 'hsl(var(--card))'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div className="nav-logo" style={{ fontSize: '1.1rem' }}>
            <GraduationCap size={20} />
            Edu<span>Vantage</span>
          </div>
          <p>© 2026 imp3rial Systems. Simplified school management for modern education.</p>
        </div>
      </footer>
    </div>
  );
}
