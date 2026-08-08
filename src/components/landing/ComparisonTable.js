'use client';

import React from 'react';
import { Check, X, Zap } from 'lucide-react';

export default function ComparisonTable() {
  const comparisonItems = [
    {
      feature: 'Built-in Proctored CBT Exams',
      eduvantage: true,
      legacy: false,
      detail: 'Anti-cheat monitoring, tab-switch counts, automated scoring included',
    },
    {
      feature: 'Consolidated Pricing (Zero Multi-Sub Fees)',
      eduvantage: true,
      legacy: false,
      detail: 'Replaces separate SMS, LMS, CBT, and fee tracking software',
    },
    {
      feature: 'Multi-Tenant Database Privacy (RLS)',
      eduvantage: true,
      legacy: 'Varies',
      detail: 'Strict row-level security per school instance',
    },
    {
      feature: 'Instant Report Card & Grade Compilation',
      eduvantage: true,
      legacy: true,
      detail: 'Auto-calculates term sheets and class rankings in seconds',
    },
    {
      feature: 'Parent-Student Linked Mobile Access',
      eduvantage: true,
      legacy: 'Extra Fee',
      detail: 'Real-time attendance feeds, grade releases, and tuition statements',
    },
    {
      feature: 'Setup & Onboarding Time',
      eduvantageText: '< 24 Hours',
      legacyText: '3 – 6 Weeks',
      detail: 'Zero server installation required — cloud browser ready',
    },
  ];

  return (
    <section id="comparison" className="py-5xl px-lg bg-muted/40 border-b border-border">
      <div className="container max-w-hero">
        <div className="text-center mb-3xl">
          <span className="executive-badge mb-sm">
            <span className="gold-dot" />
            <span>Head-to-Head Comparison</span>
          </span>
          <h2 className="text-section-title mb-sm text-foreground">
            Why Schools Switch to IMP3RIAL EDU
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto font-normal text-muted-foreground">
            See how IMP3RIAL EDU compares directly against fragmented legacy software stacks.
          </p>
        </div>

        <div className="comparison-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Core Capabilities</th>
                <th className="comparison-highlight-col" style={{ width: '30%' }}>
                  <div className="flex items-center gap-xs text-primary font-bold">
                    <Zap size={16} /> IMP3RIAL EDU Suite
                  </div>
                </th>
                <th style={{ width: '30%' }}>Legacy Multi-Vendor Apps</th>
              </tr>
            </thead>
            <tbody>
              {comparisonItems.map((item) => (
                <tr key={item.feature}>
                  <td>
                    <div className="font-bold text-foreground">{item.feature}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
                  </td>
                  <td className="comparison-highlight-col font-bold">
                    {item.eduvantageText ? (
                      <span className="text-emerald-600 font-bold">{item.eduvantageText}</span>
                    ) : item.eduvantage ? (
                      <span className="inline-flex items-center gap-xs text-emerald-600 font-bold text-sm">
                        <Check size={18} strokeWidth={3} /> Included
                      </span>
                    ) : (
                      <X size={18} className="text-muted-foreground" />
                    )}
                  </td>
                  <td className="text-muted-foreground">
                    {item.legacyText ? (
                      <span className="text-rose-600 font-semibold">{item.legacyText}</span>
                    ) : item.legacy === true ? (
                      <span className="inline-flex items-center gap-xs text-foreground text-sm">
                        <Check size={16} /> Standard
                      </span>
                    ) : item.legacy === 'Varies' || item.legacy === 'Extra Fee' ? (
                      <span className="text-amber-700 font-medium text-xs px-xs py-0.5 rounded bg-amber-100">
                        {item.legacy}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-xs text-rose-600 text-sm">
                        <X size={16} /> Not Available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
