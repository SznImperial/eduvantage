import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="footer-wrapper">
      <div className="container flex flex-col items-center gap-sm">
        <div className="nav-logo text-sm-medium">
          <GraduationCap size={20} />
          Edu<span>Vantage</span>
        </div>
        <p>© 2026 imp3rial Systems. Simplified school management for modern education.</p>
      </div>
    </footer>
  );
}
