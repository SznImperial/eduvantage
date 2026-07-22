'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { 
  createTimetableSlotAction, 
  deleteTimetableSlotAction 
} from '@/app/actions';

export default function AdminTimetablePage() {
  const supabase = createClient();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  // Status indicators
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [allocCsId, setAllocCsId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch classes
      const { data: clsList } = await supabase.from('classes').select('*').order('name');
      if (clsList) {
        setClasses(clsList);
        if (clsList.length > 0 && !selectedClassId) {
          setSelectedClassId(clsList[0].id);
        }
      }

      // 2. Fetch subjects
      const { data: subList } = await supabase.from('subjects').select('*');
      if (subList) setSubjects(subList);

      // 3. Fetch class subjects
      const { data: csList } = await supabase.from('class_subjects').select('*');
      if (csList) setClassSubjects(csList);

      // 4. Fetch teachers
      const { data: profList } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      if (profList) setTeachers(profList);

      // 5. Fetch timetable slots
      const { data: slotList } = await supabase.from('timetable_slots').select('*');
      if (slotList) setSlots(slotList);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter class subjects for form dropdown based on selectedClassId
  const currentClassSubjects = classSubjects.filter(cs => cs.class_id === selectedClassId);

  useEffect(() => {
    if (currentClassSubjects.length > 0) {
      setAllocCsId(currentClassSubjects[0].id);
    } else {
      setAllocCsId('');
    }
  }, [selectedClassId, classSubjects]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!allocCsId || !dayOfWeek || !startTime || !endTime || !room) return;
    setError(''); setSuccess('');

    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }

    setSaving(true);

    // Collision Detection Logic (Locally checked against active slots)
    const currentCs = classSubjects.find(x => x.id === allocCsId);
    const teacherId = currentCs?.teacher_id;

    const conflict = slots.find(slot => {
      // Same day, overlapping times
      const sameDay = slot.day_of_week === dayOfWeek;
      const timeOverlap = (startTime >= slot.start_time && startTime < slot.end_time) || 
                          (endTime > slot.start_time && endTime <= slot.end_time) ||
                          (startTime <= slot.start_time && endTime >= slot.end_time);
      
      if (sameDay && timeOverlap) {
        // A: Room Conflict
        if (slot.room.toLowerCase().trim() === room.toLowerCase().trim()) {
          setError(`Collision Warning: Room "${room}" is already booked for another class during this timeslot.`);
          return true;
        }
        
        // B: Teacher Conflict
        const slotCs = classSubjects.find(x => x.id === slot.class_subject_id);
        if (teacherId && slotCs && slotCs.teacher_id === teacherId) {
          const tchr = teachers.find(t => t.id === teacherId);
          const name = tchr ? `${tchr.first_name} ${tchr.last_name}` : 'The assigned teacher';
          setError(`Collision Warning: ${name} is already scheduled to teach another class during this timeslot.`);
          return true;
        }
      }
      return false;
    });

    if (conflict) {
      setSaving(false);
      return;
    }

    const res = await createTimetableSlotAction(allocCsId, dayOfWeek, startTime, endTime, room);
    setSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Timetable slot added successfully!');
      setRoom('');
      loadData();
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm('Are you sure you want to remove this scheduled slot?')) return;
    setError(''); setSuccess('');
    const res = await deleteTimetableSlotAction(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Timetable slot removed.');
      loadData();
    }
  };

  const filteredSlots = slots.filter(slot => {
    const cs = classSubjects.find(x => x.id === slot.class_subject_id);
    return cs && cs.class_id === selectedClassId;
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Weekly Timetable Planner</h1>
        <p>Construct weekly schedules, define class periods, assign classrooms, and prevent resource conflicts.</p>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={14} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Class selector */}
      <div className="card glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Select Class to Manage:</span>
          <select
            value={selectedClassId}
            onChange={e => { setSelectedClassId(e.target.value); setError(''); setSuccess(''); }}
            className="input"
            style={{ width: '100%', maxWidth: '240px', padding: '0.4rem 0.75rem' }}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
          {filteredSlots.length} schedule periods assigned
        </span>
      </div>

      <div className="split-layout-1-2">
        {/* Left Form Panel */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '4.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add New Slot
            </h3>

            {currentClassSubjects.length === 0 ? (
              <div style={{ padding: '1.25rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                No active subjects mapped to this class section yet. Please configure courses in Classes & Subjects first.
              </div>
            ) : (
              <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Course Subject</label>
                  <select className="input" value={allocCsId} onChange={e => setAllocCsId(e.target.value)} required>
                    {currentClassSubjects.map(cs => {
                      const sub = subjects.find(s => s.id === cs.subject_id);
                      const tchr = teachers.find(t => t.id === cs.teacher_id);
                      return (
                        <option key={cs.id} value={cs.id}>
                          {sub ? `${sub.name} (${sub.code})` : 'Unknown'} - {tchr ? `${tchr.first_name} ${tchr.last_name[0]}.` : 'No Teacher'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Day of Week</label>
                  <select className="input" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} required>
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Room / Lecture Hall</label>
                  <input className="input" value={room} placeholder="e.g. Science Lab, Room 10B" onChange={e => setRoom(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                  {saving ? 'Saving Slot...' : 'Add Slot to Timetable'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Timetable Schedule Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {days.map(day => {
            const daySlots = filteredSlots
              .filter(s => s.day_of_week === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));

            return (
              <div key={day} className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'hsl(var(--primary))' }}>
                  {day}
                </h4>

                {daySlots.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {daySlots.map(slot => {
                      const cs = classSubjects.find(x => x.id === slot.class_subject_id);
                      const sub = subjects.find(s => s.id === cs?.subject_id);
                      const tchr = teachers.find(t => t.id === cs?.teacher_id);
                      return (
                        <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--muted) / 0.12)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                              <Clock size={13} /> {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.9rem' }}>{sub ? sub.name : 'Unknown Subject'}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.5rem' }}>({sub?.code})</span>
                              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.15rem' }}>
                                Teacher: {tchr ? `${tchr.first_name} ${tchr.last_name}` : 'Not assigned'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                              <MapPin size={13} /> {slot.room}
                            </div>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              style={{ background: 'none', border: 'none', color: 'hsl(var(--destructive))', cursor: 'pointer', padding: '0.25rem' }}
                              title="Delete Slot"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', padding: '0.25rem 0' }}>No classes scheduled.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
