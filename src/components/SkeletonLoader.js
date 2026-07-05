import React from 'react';

export default function SkeletonLoader({ rows = 3, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', ...style }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: i === 0 ? '48px' : '32px',
            width: i === 0 ? '100%' : `${85 - i * 10}%`,
            opacity: 1 - i * 0.15
          }}
        />
      ))}
    </div>
  );
}
