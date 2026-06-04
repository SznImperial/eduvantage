import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Users, BookOpen, Megaphone, ArrowRight, Plus } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch counts from Database
  // 1. Teachers count
  const { count: teachersCount, error: errT } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher');

  // 2. Students count
  const { count: studentsCount, error: errS } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // 3. Classes count
  const { count: classesCount, error: errC } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true });

  // 4. Latest announcements
  const { data: announcements, error: errA } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Admin Portal</h1>
        <p>
          Manage your school&apos;s workspace, register classes, and set up user profiles.
        </p>
      </div>

      {/* Overview Grid */}
      <div className="dashboard-grid">
        <div className="card card-hover animate-slide-up stagger-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon stat-icon-indigo">
              <Users size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 550, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Teachers</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginTop: '0.125rem' }}>{teachersCount || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border) / 0.6)' }}>
            <Link href="/dashboard/admin/users?role=teacher" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(var(--accent-indigo-text))', fontWeight: 550 }}>
              Manage Teachers <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="card card-hover animate-slide-up stagger-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon stat-icon-violet">
              <Users size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 550, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Students</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginTop: '0.125rem' }}>{studentsCount || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border) / 0.6)' }}>
            <Link href="/dashboard/admin/users?role=student" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(var(--accent-violet-text))', fontWeight: 550 }}>
              Manage Students <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="card card-hover animate-slide-up stagger-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon stat-icon-emerald">
              <BookOpen size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 550, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Classes</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginTop: '0.125rem' }}>{classesCount || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border) / 0.6)' }}>
            <Link href="/dashboard/admin/classes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(var(--accent-emerald-text))', fontWeight: 550 }}>
              Manage Classes <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="responsive-grid-2-1">
        {/* Latest Announcements */}
        <div className="card animate-slide-up stagger-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>School Billboard</h3>
            <Link href="/dashboard/admin/announcements" className="btn btn-outline" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}>
              <Plus size={14} /> Post Announcement
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="announcement-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{ann.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    {ann.content}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-indigo-text))', fontWeight: 550 }}>
                    Posted by: Admin ({ann.profiles?.first_name} {ann.profiles?.last_name})
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={24} />
                </div>
                <p>No announcements posted yet. Use the button above to publish.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="card animate-slide-up stagger-4" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Quick Controls</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Link href="/dashboard/admin/users" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
              <Users size={16} /> Add Teacher or Student
            </Link>
            
            <Link href="/dashboard/admin/classes" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
              <BookOpen size={16} /> Set Up Subjects & Classes
            </Link>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Tenant Database Security:</span>
            Every query executed on this portal is implicitly bound to your school context by Row-Level Security policies.
          </div>
        </div>
      </div>
    </div>
  );
}
