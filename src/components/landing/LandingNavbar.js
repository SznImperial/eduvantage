'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { Menu, X } from 'lucide-react';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    document.body.classList.add('menu-open');

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <Link href="/" className="nav-logo" onClick={closeMenu}>
        <Image
          src="/imperial-edu-logo.svg"
          alt="IMP3RIAL EDU"
          width={36}
          height={36}
          className="shrink-0"
        />
        <span>IMP3RIAL EDU</span>
      </Link>

      <button
        type="button"
        className="mobile-nav-toggle"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        aria-controls="landing-nav"
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div
        className={`nav-overlay${isMenuOpen ? ' open' : ''}`}
        onClick={closeMenu}
        aria-hidden={!isMenuOpen}
      />

      <nav id="landing-nav" className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
        <a href="#features" className="nav-link" onClick={closeMenu}>Features</a>
        <a href="#portals" className="nav-link" onClick={closeMenu}>Portals</a>
        <a href="#pricing" className="nav-link" onClick={closeMenu}>Pricing</a>
        <a href="#security" className="nav-link" onClick={closeMenu}>Security</a>
        <Link href="/login" className="nav-link" onClick={closeMenu}>Sign in</Link>
        <ThemeToggle />
        <Link href="/register" className="btn btn-primary btn-pill-sm" onClick={closeMenu}>
          Get started
        </Link>
      </nav>
    </header>
  );
}
