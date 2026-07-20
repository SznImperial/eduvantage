import React from 'react';
import FeatureCard from './FeatureCard';
import { Database, CheckCircle2, Award, Calendar, CreditCard, Laptop } from 'lucide-react';

export default function TechnicalHighlights() {
  const features = [
    {
      title: 'Academic grading',
      description: 'Record exams and continuous assessment, compute rankings, and compile report cards.',
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
      title: 'Attendance tracking',
      description: 'Replace paper registers with digital classroom rolls and monthly summaries.',
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
      title: 'Computer-based testing',
      description: 'Create, schedule, and score online exams inside the student portal.',
      icon: Laptop,
      colorClass: 'stat-icon-violet',
      animationClass: 'stagger-3',
      tag: 'Included',
      bullets: [
        'Exam builder & scheduling',
        'Automatic scoring',
        'Candidate exam lobby',
      ],
    },
    {
      title: 'Tuition & fees',
      description: 'Invoice by class, track payments, and review collection progress.',
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
      title: 'Timetable planner',
      description: 'Build campus schedules, assign subjects, and coordinate teacher hours.',
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
      title: 'Institutional privacy',
      description: 'Keep records isolated per school with role-based access and regular backups.',
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
    <section id="features" className="py-5xl px-lg">
      <div className="container">
        <div className="text-center mb-3xl">
          <h2 className="text-section-title mb-sm">
            Everything your school needs in one place
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto">
            Academic tools designed to reduce paperwork, save staff time, and keep student records secure.
          </p>
        </div>

        <div className="grid-auto-fit">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
