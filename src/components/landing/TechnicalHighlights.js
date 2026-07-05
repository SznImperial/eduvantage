import React from 'react';
import FeatureCard from './FeatureCard';
import { Database, LayoutGrid, CheckCircle2 } from 'lucide-react';

export default function TechnicalHighlights() {
  const features = [
    {
      title: "Complete Data Privacy",
      description: "Your school's records are kept completely isolated and secure. We prioritize student data privacy so you can focus on education.",
      icon: Database,
      colorClass: "stat-icon-indigo",
      animationClass: "stagger-1"
    },
    {
      title: "Lightning Fast Performance",
      description: "Built on next-generation web tech for instant page loads. Access attendance logs, class schedules, and grades in real-time.",
      icon: LayoutGrid,
      colorClass: "stat-icon-violet",
      animationClass: "stagger-2"
    },
    {
      title: "Made for Everyone",
      description: "Tailored portals for administrators, teachers, and students alike. Intuitive controls mean no extensive training or manuals required.",
      icon: CheckCircle2,
      colorClass: "stat-icon-emerald",
      animationClass: "stagger-3"
    }
  ];

  return (
    <section className="py-5xl px-lg">
      <div className="container">
        <div className="text-center mb-3xl">
          <h2 className="text-section-title mb-sm">
            Built for the modern classroom
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto">
            A powerful, lightweight tool designed to make school operations effortless and secure.
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
