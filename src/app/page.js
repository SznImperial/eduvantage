import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import RoiCalculator from '@/components/landing/RoiCalculator';
import TechnicalHighlights from '@/components/landing/TechnicalHighlights';
import InteractiveRoleShowcase from '@/components/landing/InteractiveRoleShowcase';
import ComparisonTable from '@/components/landing/ComparisonTable';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFaq from '@/components/landing/LandingFaq';
import LandingCtaBanner from '@/components/landing/LandingCtaBanner';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="page-wrapper landing-dark">
      <LandingNavbar />
      <main className="main-content">
        <LandingHero />
        <RoiCalculator />
        <TechnicalHighlights />
        <InteractiveRoleShowcase />
        <ComparisonTable />
        <LandingPricing />
        <LandingFaq />
        <LandingCtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
