import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, ShieldCheck } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="footer-wrapper border-t border-border bg-transparent">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col footer-col-brand">
            <div className="nav-logo flex items-center gap-xs">
              <Image
                src="/imperial-edu-logo.svg"
                alt="IMP3RIAL EDU"
                width={32}
                height={32}
                className="shrink-0"
              />
              <span className="font-black text-base text-foreground tracking-tight">IMP3RIAL EDU</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
              Multi-tenant school operating system centralizing academics, proctored CBT exams, tuition recovery, and parent communication.
            </p>
            <div className="flex items-center gap-xs text-xs font-bold text-primary">
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Row-Level Encrypted Privacy</span>
            </div>
          </div>

          <div className="footer-col">
            <span className="footer-title text-foreground font-bold">Capabilities</span>
            <a href="#calculator" className="footer-link">ROI Calculator</a>
            <a href="#features" className="footer-link">Institutional Suite</a>
            <a href="#portals" className="footer-link">Proctored CBT Demo</a>
            <a href="#comparison" className="footer-link">Head-to-Head Comparison</a>
          </div>

          <div className="footer-col">
            <span className="footer-title text-foreground font-bold">Licensing</span>
            <a href="#pricing" className="footer-link font-medium">Pricing Plans</a>
            <Link href="/register" className="footer-link">Start 14-Day Pilot</Link>
            <Link href="/login" className="footer-link">Portal Login</Link>
            <a href="#faq" className="footer-link">Executive FAQ</a>
          </div>

          <div className="footer-col">
            <span className="footer-title text-foreground font-bold">Governance &amp; Trust</span>
            <Link href="/privacy#architecture" className="footer-link">Row-Level Security Architecture</Link>
            <Link href="/privacy" className="footer-link">Data Privacy Guarantee</Link>
            <Link href="/terms#availability" className="footer-link">99.99% Uptime SLA</Link>
          </div>
        </div>

        <div className="footer-bottom border-t border-border pt-md">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Imp3rial.dev Systems. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">Privacy Policy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
