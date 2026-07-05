import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function AuthCard({ title, subtitle, children, wide = false }) {
  return (
    <div className={`card auth-card glass-panel animate-scale-in ${wide ? 'auth-card-wide' : 'auth-card-default'}`}>
      <div className="auth-card-header">
        <div className="auth-card-icon">
          <GraduationCap size={30} />
        </div>
        <h2 className="auth-card-title">{title}</h2>
        <p className="auth-card-subtitle">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
