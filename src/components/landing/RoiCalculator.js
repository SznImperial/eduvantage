'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function RoiCalculator() {
  const [selectedPlanId, setSelectedPlanId] = useState('growth');
  const [studentCount, setStudentCount] = useState(350);

  const plans = [
    {
      id: 'free',
      name: 'Free Pilot',
      annualPrice: 0,
      minStudents: 1,
      maxStudents: 10,
      presets: [1, 5, 10],
      highlights: 'Basic grading & attendance',
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      annualPrice: 450000,
      minStudents: 10,
      maxStudents: 100,
      presets: [10, 25, 50, 100],
      highlights: 'Standard grading & Priority support',
    },
    {
      id: 'growth',
      name: 'Growth School Plan',
      annualPrice: 700000,
      minStudents: 50,
      maxStudents: 500,
      presets: [50, 150, 350, 500],
      highlights: 'Proctored CBT Engine & Parent Portal',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network Plan',
      annualPrice: 1300000,
      minStudents: 100,
      maxStudents: 1500,
      presets: [250, 500, 1000, 1500],
      highlights: 'Unlimited capacity & Dedicated DB',
    },
  ];

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[2];
  const planAnnualCost = selectedPlan.annualPrice;

  const handlePlanSelect = (plan) => {
    setSelectedPlanId(plan.id);
    if (studentCount > plan.maxStudents) {
      setStudentCount(plan.maxStudents);
    } else if (studentCount < plan.minStudents) {
      setStudentCount(plan.minStudents);
    }
  };

  // Math Calculations
  const costPerStudentAnnual = studentCount > 0 ? Math.round(planAnnualCost / studentCount) : 0;
  const costPerStudentPerTerm = Math.round(costPerStudentAnnual / 3);
  const costPerStudentPerMonth = Math.round(costPerStudentAnnual / 12);

  const formatNaira = (amount) => {
    return '₦' + amount.toLocaleString('en-NG');
  };

  return (
    <section id="calculator" className="py-5xl px-lg border-y border-border bg-transparent">
      <div className="container relative z-10 max-w-hero">
        <div className="text-center mb-3xl">
          <span className="executive-badge mb-sm">
            <span className="gold-dot" />
            <span>Interactive Fee Calculator</span>
          </span>
          <h2 className="text-section-title mb-sm text-foreground">
            Calculate Your Cost Per Student Per Term
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto font-normal text-muted-foreground">
            Select a plan to lock its student capacity cap, then adjust the slider to see the exact per-student term fee.
          </p>
        </div>

        <div className="grid-split-6-6 items-start gap-2xl">
          {/* Controls Column */}
          <div className="glass-panel p-xl rounded-xl w-full space-y-xl">
            {/* 1. Plan Selector */}
            <div>
              <div className="flex justify-between items-center mb-md">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  1. Select Licensing Tier
                </label>
                <span className="text-xs font-bold text-primary flex items-center gap-xs">
                  <ShieldCheck size={14} className="text-amber-600" /> Multi-Tenant Secured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan)}
                      className={`p-md rounded-lg border text-left transition-all duration-200 relative ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-card hover:border-slate-400 hover:bg-muted/30'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Recommended
                        </span>
                      )}
                      <div className="font-extrabold text-sm text-foreground mb-0.5">{plan.name}</div>
                      <div className="text-base font-black text-primary mb-1">
                        {plan.annualPrice === 0 ? '₦0 Free Pilot' : `${formatNaira(plan.annualPrice)} / yr`}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 bg-secondary px-xs py-0.5 rounded inline-block">
                        Cap: Up to {plan.maxStudents} Students
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Modern Capacity Slider & Presets */}
            <div className="pt-md border-t border-border space-y-md">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                    2. Enrolled Student Capacity
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Capped for {selectedPlan.name} (Max {selectedPlan.maxStudents})
                  </span>
                </div>
                <div className="text-2xl font-black text-primary bg-secondary px-md py-xs rounded-lg border border-border">
                  {studentCount} <span className="text-xs font-bold text-muted-foreground">Students</span>
                </div>
              </div>

              <input
                type="range"
                min={selectedPlan.minStudents}
                max={selectedPlan.maxStudents}
                step={selectedPlan.maxStudents <= 10 ? 1 : 25}
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="roi-range-input"
                aria-label={`Enrolled students slider capped at ${selectedPlan.maxStudents}`}
              />

              {/* Quick Presets Chips */}
              <div className="flex items-center gap-xs flex-wrap pt-xs">
                <span className="text-xs font-semibold text-muted-foreground mr-xs">Quick Select:</span>
                {selectedPlan.presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStudentCount(preset)}
                    className={`preset-chip ${studentCount === preset ? 'active' : ''}`}
                  >
                    {preset} Students
                  </button>
                ))}
              </div>
            </div>

            {/* Step-by-Step Math Breakdown Box */}
            <div className="p-md rounded-lg bg-secondary/80 border border-border text-xs space-y-xs">
              <div className="font-extrabold text-foreground flex items-center gap-xs">
                <Calculator size={14} className="text-primary" /> Transparent Calculation Formula:
              </div>
              <div className="text-muted-foreground">
                {formatNaira(planAnnualCost)} ({selectedPlan.name}) ÷ {studentCount} Students = <strong className="text-foreground">{formatNaira(costPerStudentAnnual)} / student / year</strong>
              </div>
              <div className="text-muted-foreground">
                {formatNaira(costPerStudentAnnual)} ÷ 3 Academic Terms = <strong className="text-primary font-bold">{formatNaira(costPerStudentPerTerm)} per student per term</strong>
              </div>
            </div>
          </div>

          {/* 2026 Executive Result Display Card */}
          <div className="glass-panel p-xl rounded-xl w-full border-primary/20 sticky top-24">
            <div className="flex justify-between items-center border-b border-border pb-md">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-muted-foreground block">
                  Per-Student Term Allocation
                </span>
                <span className="text-xs font-bold text-primary">
                  {selectedPlan.name} (Max {selectedPlan.maxStudents})
                </span>
              </div>
              <span className="px-sm py-xs rounded-full text-xs font-extrabold bg-white/15 text-white backdrop-blur-sm">
                3 Terms / Year
              </span>
            </div>

            <div className="py-xs">
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-xs">
                {formatNaira(costPerStudentPerTerm)}
              </div>
              <span className="text-sm font-semibold text-slate-300">
                per student per academic term
              </span>
            </div>

            <div className="inline-flex items-center gap-xs px-md py-sm rounded-lg text-xs font-bold bg-white/10 border border-white/15">
              <CheckCircle2 size={16} className="text-emerald-400" /> Only {formatNaira(costPerStudentPerMonth)} per student per month
            </div>

            <div className="grid grid-cols-2 gap-md border-t border-white/15 pt-md">
              <div>
                <span className="text-xs text-slate-300 font-semibold block mb-xs">Annual Cost / Student</span>
                <span className="text-xl font-extrabold text-white">{formatNaira(costPerStudentAnnual)} / yr</span>
              </div>
              <div>
                <span className="text-xs text-slate-300 font-semibold block mb-xs">Key Capability Included</span>
                <span className="text-xs font-bold text-amber-300 leading-tight block">{selectedPlan.highlights}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Adding just <strong className="text-white">{formatNaira(costPerStudentPerTerm)}</strong> to your student term fee structure completely covers administrative management, proctored CBT exams, auto-grading, and parent mobile access.
            </p>

            <Link
              href="/register"
              className="btn btn-pill bg-white text-slate-900 hover:bg-slate-100 w-full font-bold justify-center py-md shadow-lg text-sm"
            >
              Select {selectedPlan.name} &amp; Start Pilot
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
