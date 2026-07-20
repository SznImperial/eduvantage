import React from 'react';

export default function FeatureCard({ title, description, icon: Icon, colorClass, animationClass, tag, bullets }) {
  return (
    <div className={`card card-hover flex flex-col items-start gap-md animate-fade-in ${animationClass || ''}`}>
      <div className="flex items-center gap-md w-full">
        <div className={`stat-icon ${colorClass}`}>
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <h3 className="text-sm-medium font-bold mb-0">
          {title}
          {tag && <span className="feature-tag">{tag}</span>}
        </h3>
      </div>
      <div className="w-full">
        <p className="text-sm text-muted leading-relaxed">
          {description}
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="feature-bullets">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="feature-bullet-item">
                <span className="feature-bullet-dot" />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
