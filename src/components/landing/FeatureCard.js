import React from 'react';

export default function FeatureCard({ title, description, icon: Icon, colorClass, animationClass }) {
  return (
    <div className={`card card-hover flex items-start gap-lg animate-fade-in ${animationClass}`}>
      <div className={`stat-icon ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-sm-medium font-bold mb-sm">
          {title}
        </h3>
        <p className="text-sm-medium text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
