import React from 'react';
import { CheckCircle } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container hero-layout">
        <div className="hero-content">
          <span className="hero-badge">#1 School Management Platform in Nigeria</span>
          <h1 className="hero-title">
            Complete School Management
            <span className="highlight">for Nigerian Schools</span>
          </h1>
          <p className="hero-desc">
            Empower your administration, engage parents, and simplify learning with our all-in-one software built specifically for the modern Nigerian educational system.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary cursor-pointer">Start Free Trial</button>
            <button className="btn btn-secondary cursor-pointer">Book a Demo</button>
          </div>
          <div className="hero-checks">
            <span><CheckCircle size={18} color="var(--color-edugreen)" /> No Credit Card required</span>
            <span><CheckCircle size={18} color="var(--color-edugreen)" /> Cancel anytime</span>
          </div>
        </div>
        <div className="hero-image">
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <h2 style={{ color: 'var(--color-edugreen)', marginBottom: '10px' }}>Dashboard Preview</h2>
            <div style={{ width: '300px', height: '200px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '20px', background: '#f3f4f6', borderRadius: '4px' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', flex: 1 }}>
                 <div style={{ background: '#e5e7eb', borderRadius: '4px' }}></div>
                 <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#e5e7eb', borderRadius: '4px' }}></div>
                    <div style={{ background: '#e5e7eb', borderRadius: '4px' }}></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
