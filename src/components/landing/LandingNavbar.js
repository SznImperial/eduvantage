'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { GraduationCap, Menu, X } from 'lucide-react';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <Link href="/" className="nav-logo flex items-center gap-2">
        <Image src="/imperial-edu-logo.svg" alt="IMP3RIAL EDU Logo" width={48} height={48} className="shrink-0" />
        <span className="font-extrabold text-xl">IMP3RIAL EDU</span>
      </Link>

      <button
        className="mobile-nav-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
        <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Features
        </a>
        <a href="#portals" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Portals
        </a>
        <a href="#pricing" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Pricing
        </a>
        <a href="#security" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Security
        </a>
        <Link href="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Sign In
        </Link>
        <ThemeToggle />
        <Link href="/register" className="btn btn-primary btn-pill-sm" onClick={() => setIsMenuOpen(false)}>
          Get Started
        </Link>
      </nav>
    </header>
  );
}
