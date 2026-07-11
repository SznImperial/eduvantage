import React from 'react';
import FeatureCard from './FeatureCard';
import { Database, LayoutGrid, CheckCircle2, Award, Calendar, CreditCard, Laptop } from 'lucide-react';

export default function TechnicalHighlights() {
  const features = [
    {
      title: "Academic Grading System",
      description: "Automate exam and test records, compute class rankings, and compile report cards instantly.",
      icon: Award,
      colorClass: "stat-icon-indigo",
      animationClass: "stagger-1",
      bullets: [
        "One-click term sheet compilation",
        "Subject grade-weight configurations",
        "Student transcript track records"
      ]
    },
    {
      title: "Real-time Attendance Logs",
      description: "Ditch manual sheets with our digital classroom checks and check-in rosters.",
      icon: CheckCircle2,
      colorClass: "stat-icon-emerald",
      animationClass: "stagger-2",
      bullets: [
        "Daily digital attendance rolls",
        "Monthly attendance statistics",
        "Absent indicators & logs"
      ]
    },
    {
      title: "Computer-Based Testing (CBT)",
      description: "Administer online exams directly inside portals with secure immediate scoring.",
      icon: Laptop,
      colorClass: "stat-icon-violet",
      animationClass: "stagger-3",
      tag: "Active Module",
      bullets: [
        "Online exam creator & scheduling",
        "Immediate auto-grading scores",
        "Interactive test candidate portal"
      ]
    },
    {
      title: "Tuition & Fees Dashboard",
      description: "Invoice classes, track student payments, and generate transaction summaries.",
      icon: CreditCard,
      colorClass: "stat-icon-amber",
      animationClass: "stagger-1",
      bullets: [
        "Class-based tuition invoicing",
        "Pending balance notifications",
        "Income stats & collections ledger"
      ]
    },
    {
      title: "Class Schedules & Planner",
      description: "Plan campus timetables, select courses, and outline teacher work hours.",
      icon: Calendar,
      colorClass: "stat-icon-rose",
      animationClass: "stagger-2",
      bullets: [
        "Interactive timetable editor",
        "Subject-to-classroom mapping",
        "Teacher assignment planners"
      ]
    },
    {
      title: "Institutional-Grade Privacy",
      description: "Keep records secure with isolated databases and automated daily backups.",
      icon: Database,
      colorClass: "stat-icon-indigo",
      animationClass: "stagger-3",
      bullets: [
        "Supabase Row-Level Security (RLS)",
        "Daily automated database backups",
        "Role-based privilege permissions"
      ]
    }
  ];

  return (
    <section id="features" className="py-5xl px-lg">
      <div className="container">
        <div className="text-center mb-3xl">
          <h2 className="text-section-title mb-sm">
            Everything your school needs, in one portal
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto">
            A comprehensive suite of academic tools designed to save time, eliminate paper clutter, and keep student records safe.
          </p>
        </div>

        <div className="grid-auto-fit">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
