import React from 'react';

export default function StatCard({ title, value, description, icon: Icon, colorClass, delay = 0 }) {
  return (
    <div className="card card-hover animate-slide-up" style={{ animationDelay: `${delay}s` }}>
      <div className="flex justify-between items-center mb-sm">
        <span className="text-xs font-bold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div className={`stat-icon ${colorClass}`} style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
          <Icon size={18} />
        </div>
      </div>
      <h3 className="text-section-title-md text-foreground" style={{ marginBottom: '0.25rem' }}>
        {value}
      </h3>
      <p className="text-sm-medium text-muted">
        {description}
      </p>
    </div>
  );
}
