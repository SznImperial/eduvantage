import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import TechnicalHighlights from '@/components/landing/TechnicalHighlights';
import UserPortals from '@/components/landing/UserPortals';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="page-wrapper">
      <LandingNavbar />
      <main className="main-content">
        <LandingHero />
        <TechnicalHighlights />
        <UserPortals />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
}
