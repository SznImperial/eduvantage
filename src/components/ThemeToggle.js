'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Read the current attribute value set by our non-blocking script
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '0.5rem',
        borderRadius: '12px',
        width: '38px',
        height: '38px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--card))',
        cursor: 'pointer',
        color: 'hsl(var(--muted-foreground))',
        transition: 'all 0.2s ease',
        outline: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--muted-foreground) / 0.3)';
        e.currentTarget.style.color = 'hsl(var(--foreground))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--border))';
        e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
      }}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
