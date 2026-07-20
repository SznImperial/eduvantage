import React from 'react';

export default function StatCard({ title, value, description, icon: Icon, colorClass, delay = 0 }) {
  return (
    <div
      className="card card-hover stat-card animate-slide-up"
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      <div className="stat-card-top">
        <span className="stat-card-label">{title}</span>
        {Icon && (
          <div className={`stat-icon ${colorClass || 'stat-icon-indigo'}`}>
            <Icon size={17} strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {description && <p className="stat-card-desc">{description}</p>}
    </div>
  );
}
