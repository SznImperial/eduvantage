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
    async function fetchSession() {
      const { data } = await supabase
        .from('academic_years')
        .select('name, start_date, end_date')
        .eq('is_active', true)
        .single();
      setSession(data);
      setLoaded(true);
    }
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (!session) {
    return (
      <div className="session-chip session-chip-warn">
        <AlertTriangle size={12} strokeWidth={2} />
        <span>No active session</span>
        {role === 'admin' && (
          <Link href="/dashboard/admin/classes" className="text-primary font-bold">
            Set up →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="session-chip">
      <Calendar size={12} strokeWidth={1.75} />
      <span>{session.name}</span>
      {(session.start_date || session.end_date) && (
        <>
          <span className="session-chip-muted">·</span>
          <span className="session-chip-muted">
            {formatDate(session.start_date)} – {formatDate(session.end_date)}
          </span>
        </>
      )}
    </div>
  );
}
