'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ActiveSessionBanner({ role }) {
  const supabase = createClient();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('academic_years')
        .select('name, start_date, end_date')
        .eq('is_active', true)
        .single();
      setSession(data);
      setLoaded(true);
    }
    fetch();
  }, []);

  if (!loaded) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (!session) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 650,
        backgroundColor: 'hsl(40 90% 95%)',
        color: 'hsl(35 80% 35%)',
        border: '1px solid hsl(40 70% 85%)',
      }}>
        <AlertTriangle size={13} />
        <span>No Active Session</span>
        {role === 'admin' && (
          <Link href="/dashboard/admin/classes" style={{ color: 'hsl(var(--primary))', fontWeight: 700, marginLeft: '0.25rem' }}>
            Set up now →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.3rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.725rem',
      fontWeight: 650,
      backgroundColor: 'hsl(var(--primary) / 0.08)',
      color: 'hsl(var(--primary))',
      border: '1px solid hsl(var(--primary) / 0.15)',
    }}>
      <Calendar size={12} />
      <span>{session.name}</span>
      <span style={{ opacity: 0.5 }}>•</span>
      <span style={{ fontWeight: 550 }}>{formatDate(session.start_date)} – {formatDate(session.end_date)}</span>
    </div>
  );
}
