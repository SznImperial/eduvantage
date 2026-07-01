import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  Megaphone, 
  ArrowRight, 
  Plus, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  GraduationCap 
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch counts and metrics from Database
  // 1. Teachers count
  const { count: teachersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher');

  // 2. Students count
  const { count: studentsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // 3. Classes count
  const { count: classesCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true });

  // 4. Latest announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, audience_type, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  // 5. Fetch fee records stats
  const { data: fees } = await supabase
    .from('fee_records')
    .select('amount_owed, amount_paid');

  const totalOwed = fees ? fees.reduce((sum, f) => sum + Number(f.amount_owed), 0) : 0;
  const totalPaid = fees ? fees.reduce((sum, f) => sum + Number(f.amount_paid), 0) : 0;
  const collectionRate = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
  const outstandingFees = totalOwed - totalPaid;

  const stats = [
    {
      title: 'Total Students',
      value: studentsCount || 0,
      description: 'Enrolled in classes',
      icon: GraduationCap,
      color: 'stat-icon-emerald',
    },
    {
      title: 'Total Teachers',
      value: teachersCount || 0,
      description: 'Academic instructors',
      icon: Users,
      color: 'stat-icon-indigo',
    },
    {
      title: 'Active Classes',
      value: classesCount || 0,
      description: 'Persistent templates',
      icon: BookOpen,
      color: 'stat-icon-violet',
    },
    {
      title: 'Tuition Collected',
      value: `₦${totalPaid.toLocaleString()}`,
      description: `${collectionRate.toFixed(1)}% collected`,
      icon: CreditCard,
      color: 'stat-icon-amber',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Title Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Administrative Center</h1>
          <p>Supervise academic records, curriculum allocations, and tuition fee billing details.</p>
        </div>
        <Link 
          href="/dashboard/admin/users" 
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 650 }}
        >
          <Plus size={16} /> Register Student / Parent
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card card-hover animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.title}
                </span>
                <div className={`stat-icon ${stat.color}`} style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                  <Icon size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>
                {stat.value}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 550 }}>
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="responsive-grid-2-1">
        
        {/* Left Side: Recent notices billboard */}
        <div className="card animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="stat-icon stat-icon-amber" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                <Megaphone size={16} />
              </div>
              Recent Notifications
            </h3>
            <Link href="/dashboard/admin/announcements" className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} style={{ marginRight: '0.2rem' }} /> Add Announcement
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', padding: '1.25rem', backgroundColor: 'hsl(var(--muted)/0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground))' }}>{ann.title}</h4>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {ann.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'hsl(var(--primary))', fontWeight: 650 }}>
                      By: Admin ({ann.profiles?.first_name} {ann.profiles?.last_name})
                    </span>
                    <span className="badge badge-indigo" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                      Audience: {ann.audience_type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={20} />
                </div>
                <p style={{ fontSize: '0.85rem' }}>No announcements published yet. Click the button above to broadcast.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick navigation + Goal meters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Collection Goal Tracker banner */}
          <div style={{
            background: 'var(--primary-gradient)',
            border: '1px solid hsl(var(--primary)/0.2)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            color: 'white',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '200px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <TrendingUp size={20} style={{ color: 'hsl(var(--secondary))' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--secondary))' }}>
                  FEE COLLECTION GOAL
                </span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {collectionRate.toFixed(1)}% Achieved
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                Outstanding dues to be collected: <strong>₦{outstandingFees.toLocaleString()}</strong>
              </p>
            </div>
            
            {/* Visual Progress Bar */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(collectionRate, 100)}%`, height: '100%', backgroundColor: '#2e8b3e', transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
              </div>
            </div>
          </div>

          {/* Quick Controls Card */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'hsl(var(--foreground))' }}>
              Quick Control Pad
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link 
                href="/dashboard/admin/users" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span>Manage Users & Roster</span>
                <ArrowRight size={14} />
              </Link>
              
              <Link 
                href="/dashboard/admin/classes" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span>Curriculum & Subjects</span>
                <ArrowRight size={14} />
              </Link>

              <Link 
                href="/dashboard/admin/timetable" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span>Timetable Scheduler</span>
                <ArrowRight size={14} />
              </Link>

              <Link 
                href="/dashboard/admin/fees" 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.8rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <span>Tuition Accounts</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
