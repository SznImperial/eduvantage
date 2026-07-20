import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthCard({ title, subtitle, children, wide = false }) {
  return (
    <div className={`card auth-card animate-scale-in ${wide ? 'auth-card-wide' : 'auth-card-default'}`}>
      <div className="auth-card-header">
        <Link href="/" className="auth-card-icon" aria-label="IMP3RIAL EDU home">
          <Image
            src="/imperial-edu-logo.svg"
            alt=""
            width={28}
            height={28}
          />
        </Link>
        <h2 className="auth-card-title">{title}</h2>
        <p className="auth-card-subtitle">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
