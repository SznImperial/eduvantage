import React from 'react';
import FeatureCard from './FeatureCard';
import { Database, CheckCircle2, Award, Calendar, CreditCard, Laptop } from 'lucide-react';

export default function TechnicalHighlights() {
  const features = [
    {
      title: 'Academic Grading',
      description: 'Record exams and continuous assessment, compute rankings, and compile report cards automatically.',
      icon: Award,
      colorClass: 'stat-icon-indigo',
      animationClass: 'stagger-1',
      bullets: [
        'Term sheet compilation',
        'Subject weight configuration',
        'Student transcript history',
      ],
    },
    {
      title: 'Attendance Tracking',
      description: 'Replace paper registers with digital classroom rolls and monthly attendance summaries.',
      icon: CheckCircle2,
      colorClass: 'stat-icon-emerald',
      animationClass: 'stagger-2',
      bullets: [
        'Daily digital attendance',
        'Monthly attendance stats',
        'Absence indicators & logs',
      ],
    },
    {
      title: 'Computer-Based Testing',
      description: 'Create, schedule, and score online exams with built-in anti-cheat proctoring metrics.',
      icon: Laptop,
      colorClass: 'stat-icon-violet',
      animationClass: 'stagger-3',
      tag: 'Anti-Cheat CBT',
      bullets: [
        'Exam builder & scheduling',
        'Automatic scoring',
        'Candidate exam lobby',
      ],
    },
    {
      title: 'Tuition & Fees',
      description: 'Invoice by class, track student payments, and review outstanding collection progress.',
      icon: CreditCard,
      colorClass: 'stat-icon-amber',
      animationClass: 'stagger-1',
      bullets: [
        'Class-based invoicing',
        'Outstanding balance tracking',
        'Collections overview',
      ],
    },
    {
      title: 'Timetable Planner',
      description: 'Build campus schedules, assign subjects, and coordinate teacher classroom hours.',
      icon: Calendar,
      colorClass: 'stat-icon-rose',
      animationClass: 'stagger-2',
      bullets: [
        'Interactive timetable editor',
        'Subject-to-class mapping',
        'Teacher assignment views',
      ],
    },
    {
      title: 'Institutional Data Isolation',
      description: 'Keep student records isolated per school with strict PostgreSQL Row-Level Security (RLS).',
      icon: Database,
      colorClass: 'stat-icon-indigo',
      animationClass: 'stagger-3',
      bullets: [
        'Row-level data isolation',
        'Daily database backups',
        'Role-based permissions',
      ],
    },
  ];

  return (
    <section id="features" className="py-5xl px-lg border-b border-border bg-transparent">
      <div className="container">
        <div className="text-center mb-3xl">
          <span className="executive-badge mb-sm">
            <span className="gold-dot" />
            <span>Institutional Capabilities</span>
          </span>
          <h2 className="text-section-title mb-sm text-foreground">
            Everything Your School Needs in One Platform
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto text-muted-foreground font-normal">
            Academic tools designed to eliminate paperwork, save staff hours, and secure student records.
          </p>
        </div>

        <div className="grid-auto-fit gap-lg">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
