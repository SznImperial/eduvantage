import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-lg py-md">
      <div className="executive-badge mb-md">
        <span className="gold-dot" />
        <span>Error 404</span>
      </div>
      
      <h1 className="text-hero leading-tight font-black text-foreground mb-sm">
        Page Not Found
      </h1>
      
      <p className="max-w-subtitle text-base sm:text-lg leading-relaxed font-normal text-muted-foreground mb-lg max-w-xl mx-auto">
        The page you are looking for doesn't exist or has been moved. 
        Please check the URL or navigate back to safety.
      </p>
      
      <div className="flex flex-wrap justify-center gap-md mt-6">
        <Link href="/" className="btn btn-primary btn-pill shadow-md text-base px-lg py-md font-bold">
          Back to Home
        </Link>
        <Link href="/login" className="btn btn-outline btn-pill text-base px-lg py-md font-semibold">
          Sign In
        </Link>
      </div>
    </div>
  );
}
