import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe } from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

export default function LandingFooter() {
  return (
    <footer className="footer-wrapper">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col footer-col-brand">
            <div className="nav-logo">
              <Image
                src="/imperial-edu-logo.svg"
                alt="IMP3RIAL EDU"
                width={32}
                height={32}
                className="shrink-0"
              />
              <span>IMP3RIAL EDU</span>
            </div>
            <p className="text-xs text-muted leading-relaxed" style={{ maxWidth: '240px' }}>
              Multi-tenant school management for enrollment, academics, fees, and reporting.
            </p>
            <div className="flex gap-md">
              <a href="https://github.com" className="text-muted" target="_blank" rel="noreferrer" aria-label="GitHub">
                <GithubIcon />
              </a>
              <a href="https://twitter.com" className="text-muted" target="_blank" rel="noreferrer" aria-label="Twitter">
                <TwitterIcon />
              </a>
              <a href="https://vercel.com" className="text-muted" target="_blank" rel="noreferrer" aria-label="Website">
                <Globe size={18} strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <span className="footer-title">Product</span>
            <a href="#features" className="footer-link">Features</a>
            <a href="#portals" className="footer-link">Portals</a>
            <a href="#pricing" className="footer-link">Pricing</a>
            <a href="#security" className="footer-link">Security</a>
          </div>

          <div className="footer-col">
            <span className="footer-title">Resources</span>
            <Link href="/login" className="footer-link">Sign in</Link>
            <Link href="/register" className="footer-link">Register school</Link>
            <a href="mailto:contact@imp3rial.dev" className="footer-link">Contact</a>
          </div>

          <div className="footer-col">
            <span className="footer-title">Legal</span>
            <a href="#" className="footer-link">Privacy policy</a>
            <a href="#" className="footer-link">Terms of service</a>
            <a href="#" className="footer-link">SLA</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Imp3rial.dev. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#" className="text-muted text-xs">Security</a>
            <a href="#" className="text-muted text-xs">Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
