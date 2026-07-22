'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Megaphone, Plus, Trash2, Calendar, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { createAnnouncementAction, deleteAnnouncementAction } from '@/app/actions';

export default function AdminAnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [audienceType, setAudienceType] = useState('all');
  const [audienceId, setAudienceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, profiles(first_name, last_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  };

  const fetchMetadata = async () => {
    const { data: cls } = await supabase.from('classes').select('*').order('name');
    if (cls) setClasses(cls);

    const { data: std } = await supabase.from('profiles').select('*').eq('role', 'student').order('first_name');
    if (std) setStudents(std);
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchMetadata();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const content = formData.get('content');

    const result = await createAnnouncementAction(title, content, audienceType, audienceId || null);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Announcement published to billboard!');
      e.target.reset();
      setAudienceType('all');
      setAudienceId('');
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    
    const result = await deleteAnnouncementAction(id);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Announcement deleted.');
      fetchAnnouncements();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>School Announcements Billboard</h1>
        <p>Publish alerts, school news, and calendar updates visible to all users.</p>
      </div>

      <div className="split-layout-3-2">
        {/* Announcements List */}
        <div>
          {loading ? (
            <div className="empty-state">
                <div className="empty-state-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                <p>Loading board...</p>
            </div>
          ) : announcements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {announcements.map((ann) => (
                <div key={ann.id} className="announcement-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {ann.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', lineHeight: 1.6, marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {ann.content}
                    </p>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} /> {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <UserCheck size={12} /> By: {ann.profiles?.first_name} {ann.profiles?.last_name}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(ann.id)}
                    className="btn btn-ghost" 
                    style={{ color: 'hsl(var(--destructive))', padding: '0.5rem', alignSelf: 'flex-start', flexShrink: 0 }}
                    title="Remove Announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={24} />
                </div>
                <p>No announcements published yet.</p>
              </div>
            </div>
          )}
        </div>

        {/* Post form */}
        <div>
          <div className="card glass-panel" style={{ position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon stat-icon-violet" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Plus size={18} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Post New Announcement</h3>
            </div>

            {error && (
              <div className="alert alert-error">
                <ShieldAlert size={14} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle2 size={14} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePost}>
              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input className="input" name="title" placeholder="e.g. Mid-term Exam Schedule Published" required />
              </div>

              <div className="form-group">
                <label className="form-label">Audience Type</label>
                <select className="input" value={audienceType} onChange={(e) => { setAudienceType(e.target.value); setAudienceId(''); }}>
                  <option value="all">All Users</option>
                  <option value="class">Specific Class</option>
                  <option value="student">Specific Student</option>
                </select>
              </div>

              {audienceType === 'class' && (
                <div className="form-group">
                  <label className="form-label">Target Class</label>
                  <select className="input" value={audienceId} onChange={(e) => setAudienceId(e.target.value)} required>
                    <option value="">Select class section...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {audienceType === 'student' && (
                <div className="form-group">
                  <label className="form-label">Target Student</label>
                  <select className="input" value={audienceId} onChange={(e) => setAudienceId(e.target.value)} required>
                    <option value="">Select student profile...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Content / Message Body</label>
                <textarea 
                  className="input" 
                  name="content" 
                  rows={5} 
                  placeholder="Write the text of your announcement here..." 
                  required 
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                <Megaphone size={16} /> Publish Announcement
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
