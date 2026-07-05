import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { GraduationCap } from 'lucide-react';

export default function LandingNavbar() {
  return (
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
        <Link href="/register" className="btn btn-primary btn-pill-sm">
          Get Started
        </Link>
      </div>
    </header>
  );
}
