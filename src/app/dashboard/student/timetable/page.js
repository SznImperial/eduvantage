'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Clock, MapPin, Calendar, AlertCircle } from 'lucide-react';

export default function StudentTimetablePage() {
  const supabase = createClient();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');

  const loadTimetable = async () => {
    setLoading(true);
    try {
      // 1. Get current authenticated student user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Find enrollment to know class_id (prioritize active year, prevent PGRST116 single error)
      const [profileRes, enrollsRes] = await Promise.all([
        supabase.from('profiles').select('schools(active_academic_year_id)').eq('id', user.id).single(),
        supabase.from('enrollments').select('*, classes(name)').eq('student_id', user.id)
      ]);

      const activeYearId = profileRes.data?.schools?.active_academic_year_id;
      const enroll = enrollsRes.data?.find(e => e.academic_year_id === activeYearId) || enrollsRes.data?.[0];

      if (enroll) {
        setClassName(enroll.classes?.name || 'Class');

        // 3. Fetch class subjects mapped to this class
        const { data: classSubs } = await supabase
          .from('class_subjects')
          .select('*, subjects(name, code), profiles(first_name, last_name)')
          .eq('class_id', enroll.class_id);

        if (classSubs && classSubs.length > 0) {
          const classSubIds = classSubs.map(cs => cs.id);
          
          // 4. Fetch timetable slots mapping to those class subjects
          const { data: slots } = await supabase
            .from('timetable_slots')
            .select('*')
            .in('class_subject_id', classSubIds);

          if (slots) {
            // Map class & subject & teacher details onto each slot
            const enriched = slots.map(s => {
              const cs = classSubs.find(x => x.id === s.class_subject_id);
              return {
                ...s,
                subjectName: cs?.subjects?.name || 'Subject',
                subjectCode: cs?.subjects?.code || '',
                teacherName: cs?.profiles ? `${cs.profiles.first_name} ${cs.profiles.last_name}` : 'Not assigned'
              };
            });
            setTimetable(enriched);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load student timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Weekly Class Schedule</h1>
        <p>Your calendar grid of scheduled subject lectures and classroom assignments.</p>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Loading schedule...</p>
          </div>
        </div>
      ) : !className ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <div className="empty-state-icon">
              <AlertCircle size={24} />
            </div>
            <p>You are not currently enrolled in any class sections. Please contact your school administrator.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Active Classroom Section:</span>
            <strong style={{ fontSize: '1rem', color: 'hsl(var(--primary))' }}>{className}</strong>
          </div>

          {days.map(day => {
            const daySlots = timetable
              .filter(s => s.day_of_week === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));

            return (
              <div key={day} className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'hsl(var(--primary))' }}>
                  {day}
                </h3>

                {daySlots.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {daySlots.map(slot => (
                      <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--muted) / 0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                            <Clock size={13} /> {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>{slot.subjectName}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.5rem' }}>({slot.subjectCode})</span>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.15rem' }}>
                              Instructor: <strong>{slot.teacherName}</strong>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                          <MapPin size={13} /> {slot.room}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', padding: '0.25rem 0' }}>No scheduled classes or lectures.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
