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
  TrendingUp, 
  GraduationCap 
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import NotificationCard from '@/components/dashboard/NotificationCard';

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
    <div className="animate-fade-in pb-5xl">
      {/* Title Header */}
      <div className="flex justify-between items-center flex-wrap gap-md mb-2xl">
        <div>
          <h1 className="text-section-title">Administrative Center</h1>
          <p className="text-section-subtitle mt-xs">Supervise academic records, curriculum allocations, and tuition fee billing details.</p>
        </div>
        <Link 
          href="/dashboard/admin/users" 
          className="btn btn-primary"
        >
          <Plus size={16} /> Register Student / Parent
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="dashboard-grid mb-2xl">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            colorClass={stat.color}
            delay={idx * 0.05}
          />
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid-auto-fit-lg">
        
        {/* Left Side: Recent notices billboard */}
        <div className="card animate-slide-up flex flex-col gap-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-sm">
              <div className="stat-icon stat-icon-amber flex items-center justify-center w-8 h-8 rounded-md">
                <Megaphone size={16} />
              </div>
              Recent Notifications
            </h3>
            <Link href="/dashboard/admin/announcements" className="btn btn-outline btn-sm">
              <Plus size={14} className="mr-xs" /> Add Announcement
            </Link>
          </div>

          <div className="flex flex-col gap-md">
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <NotificationCard
                  key={ann.id}
                  title={ann.title}
                  date={ann.created_at}
                  content={ann.content}
                  authorName={`${ann.profiles?.first_name} ${ann.profiles?.last_name}`}
                  audience={ann.audience_type}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={20} />
                </div>
                <p className="text-sm">No announcements published yet. Click the button above to broadcast.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick navigation + Goal meters */}
        <div className="flex flex-col gap-xl">
          
          {/* Collection Goal Tracker banner */}
          <div className="card primary-gradient-card">
            <div>
              <div className="flex items-center gap-sm mb-sm text-secondary">
                <TrendingUp size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  FEE COLLECTION GOAL
                </span>
              </div>
              <h3 className="text-xl font-bold mb-sm text-white">
                {collectionRate.toFixed(1)}% Achieved
              </h3>
              <p className="text-sm leading-relaxed text-white-85">
                Outstanding dues to be collected: <strong>₦{outstandingFees.toLocaleString()}</strong>
              </p>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="mt-auto">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={ { width: `${Math.min(collectionRate, 100)}%` } }></div>
              </div>
            </div>
          </div>

          {/* Quick Controls Card */}
          <div className="card">
            <h3 className="text-lg font-bold mb-xl text-foreground">
              Quick Control Pad
            </h3>
            <div className="flex flex-col gap-sm">
              <Link href="/dashboard/admin/users" className="btn btn-secondary justify-between w-full">
                <span>Manage Users & Roster</span>
                <ArrowRight size={14} />
              </Link>
              
              <Link href="/dashboard/admin/classes" className="btn btn-secondary justify-between w-full">
                <span>Curriculum & Subjects</span>
                <ArrowRight size={14} />
              </Link>

              <Link href="/dashboard/admin/timetable" className="btn btn-secondary justify-between w-full">
                <span>Timetable Scheduler</span>
                <ArrowRight size={14} />
              </Link>

              <Link href="/dashboard/admin/fees" className="btn btn-secondary justify-between w-full">
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
