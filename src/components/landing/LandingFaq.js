'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ShieldCheck, HelpCircle, Lock, Zap, CreditCard, ArrowRight, MessageSquare } from 'lucide-react';

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  const faqs = [
    {
      id: 1,
      category: 'cbt',
      categoryLabel: 'CBT & Proctored Testing',
      question: 'How does the proctored CBT exam anti-cheat system work?',
      answer: 'Our built-in CBT engine tracks candidate window blur events, tab switches, microphone noise spikes, and time allocations. Every infraction generates a timestamped log entry in the principal and teacher dashboard, preventing exam malpractice without requiring expensive external software.',
      icon: ShieldCheck,
    },
    {
      id: 2,
      category: 'security',
      categoryLabel: 'Data Privacy & Security',
      question: 'Is student data kept strictly private and isolated per school?',
      answer: 'Yes! EduVantage is engineered with Supabase PostgreSQL Row-Level Security (RLS). Every school operates in complete database isolation. Cross-tenant data leakage is mathematically prevented at the database kernel level.',
      icon: Lock,
    },
    {
      id: 3,
      category: 'onboarding',
      categoryLabel: 'Setup & Data Migration',
      question: 'How easy is it to import our existing student and class records?',
      answer: 'Extremely simple. School administrators can batch upload classrooms, subjects, teachers, and student rosters via standardized CSV templates or quick inline forms. Most schools complete full workspace setup in under 2 hours.',
      icon: Zap,
    },
    {
      id: 4,
      category: 'parents',
      categoryLabel: 'Parent Portal & Billing',
      question: 'How do parents review report cards, attendance, and tuition balances?',
      answer: 'Parents receive dedicated, secure logins linked directly to their child’s profile. From any smartphone or web browser, parents can view real-time attendance logs, compiled term broadsheets, exam scores, and outstanding tuition invoices.',
      icon: CreditCard,
    },
    {
      id: 5,
      category: 'pricing',
      categoryLabel: 'Pilot Terms & Licensing',
      question: 'Can we test EduVantage with a pilot program before committing?',
      answer: 'Yes. We offer a 14-day free pilot program that allows school leaders to set up classrooms, run mock CBT exams, and test automated gradebook compilation with zero upfront cost and no credit card required.',
      icon: HelpCircle,
    },
  ];

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="py-5xl px-lg border-b border-border bg-transparent">
      <div className="container">
        <div className="text-center mb-3xl">
          <span className="executive-badge mb-sm">
            <span className="gold-dot" />
            <span>Executive FAQ &amp; Guidance</span>
          </span>
          <h2 className="text-section-title mb-sm text-foreground">
            Frequently Asked Questions for School Leaders
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto text-muted-foreground font-normal">
            Got questions about data migration, exam security, or parent onboarding? We have answers.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-xs sm:gap-sm mb-2xl">
          <button
            type="button"
            className={`hero-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Guidance
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeCategory === 'cbt' ? 'active' : ''}`}
            onClick={() => setActiveCategory('cbt')}
          >
            CBT Testing
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeCategory === 'security' ? 'active' : ''}`}
            onClick={() => setActiveCategory('security')}
          >
            Privacy &amp; RLS
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeCategory === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveCategory('onboarding')}
          >
            Setup &amp; Migration
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeCategory === 'parents' ? 'active' : ''}`}
            onClick={() => setActiveCategory('parents')}
          >
            Parent Portal
          </button>
        </div>

        <div className="grid-split-8-4 items-start">
          {/* FAQ Accordion Items */}
          <div className="space-y-md w-full">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              const IconComp = faq.icon;
              return (
                <div
                  key={faq.id}
                  className={`faq-item transition-all ${
                    isOpen ? 'border-primary shadow-sm' : 'border-border'
                  }`}
                  style={{
                    borderLeftWidth: isOpen ? '4px' : '1px',
                    borderLeftColor: isOpen ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  <button
                    type="button"
                    className="faq-button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-md">
                      <div className="p-xs rounded bg-secondary text-primary shrink-0">
                        <IconComp size={18} />
                      </div>
                      <span className="font-bold text-foreground text-left">{faq.question}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 text-muted-foreground shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="faq-content border-t border-border/50 pt-md">
                      <span className="inline-block px-xs py-0.5 rounded text-xs font-bold mb-xs bg-secondary text-primary">
                        {faq.categoryLabel}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Executive Direct Consultation Box */}
          <div className="glass-panel p-xl rounded-xl border border-white/10 space-y-md w-full">
            <div className="flex items-center gap-sm">
              <div className="p-xs rounded bg-secondary text-primary">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-base font-bold text-foreground">Need Custom Board Approval?</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              We provide tailored 1-on-1 walkthroughs and customized pilot proposals for school boards, proprietors, and district directors.
            </p>

            <div className="space-y-xs pt-xs text-xs font-medium text-foreground">
              <div className="flex items-center gap-xs">
                <span className="gold-dot" /> Custom SLA &amp; Onboarding Support
              </div>
              <div className="flex items-center gap-xs">
                <span className="gold-dot" /> Data Migration Assistance Included
              </div>
            </div>

            <Link
              href="/register"
              className="btn btn-primary btn-pill w-full font-bold text-xs justify-center py-md mt-md"
            >
              Request School Consultation
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
