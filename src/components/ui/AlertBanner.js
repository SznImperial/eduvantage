import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AlertBanner({ variant = 'error', message, className = '' }) {
  if (!message) return null;

  const config = {
    error: {
      icon: ShieldAlert,
      baseClass: 'alert alert-error',
    },
    success: {
      icon: CheckCircle2,
      baseClass: 'alert alert-success',
    },
    warning: {
      icon: AlertTriangle,
      baseClass: 'alert alert-warning',
    }
  };

  const { icon: Icon, baseClass } = config[variant] || config.error;

  return (
    <div className={`${baseClass} ${className}`.trim()}>
      <Icon size={15} />
      <span>{message}</span>
    </div>
  );
}
