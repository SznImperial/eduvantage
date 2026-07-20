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
  GraduationCap,
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import NotificationCard from '@/components/dashboard/NotificationCard';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: teachersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher');

  const { count: studentsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: classesCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true });

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, audience_type, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: fees } = await supabase
    .from('fee_records')
    .select('amount_owed, amount_paid');

  const totalOwed = fees ? fees.reduce((sum, f) => sum + Number(f.amount_owed), 0) : 0;
  const totalPaid = fees ? fees.reduce((sum, f) => sum + Number(f.amount_paid), 0) : 0;
  const collectionRate = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
  const outstandingFees = totalOwed - totalPaid;

  const stats = [
    {
      title: 'Students',
      value: studentsCount || 0,
      description: 'Enrolled in the school',
      icon: GraduationCap,
      color: 'stat-icon-emerald',
    },
    {
      title: 'Teachers',
      value: teachersCount || 0,
      description: 'Academic staff',
      icon: Users,
      color: 'stat-icon-indigo',
    },
    {
      title: 'Classes',
      value: classesCount || 0,
      description: 'Active classrooms',
      icon: BookOpen,
      color: 'stat-icon-violet',
    },
    {
      title: 'Fees collected',
      value: `₦${totalPaid.toLocaleString()}`,
      description: `${collectionRate.toFixed(1)}% of billed amount`,
      icon: CreditCard,
      color: 'stat-icon-amber',
    },
  ];

  return (
    <div className="animate-fade-in pb-5xl">
      <div className="flex justify-between items-center flex-wrap gap-md mb-2xl">
        <div className="page-header mb-0">
          <h1>Administration</h1>
          <p>Oversee people, academics, and tuition collections for your school.</p>
        </div>
        <Link href="/dashboard/admin/users" className="btn btn-primary">
          <Plus size={16} strokeWidth={1.75} />
          Register user
        </Link>
      </div>

      <div className="dashboard-grid">
        {stats.map((stat, idx) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            colorClass={stat.color}
            delay={idx * 0.04}
          />
        ))}
      </div>

      <div className="grid-auto-fit-lg">
        <div className="card flex flex-col gap-lg">
          <div className="flex justify-between items-center flex-wrap gap-sm">
            <h3 className="text-lg font-bold flex items-center gap-sm mb-0">
              <div className="stat-icon stat-icon-amber">
                <Megaphone size={16} strokeWidth={1.75} />
              </div>
              Recent announcements
            </h3>
            <Link href="/dashboard/admin/announcements" className="btn btn-outline btn-sm">
              <Plus size={14} strokeWidth={1.75} />
              New
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
                  authorName={`${ann.profiles?.first_name || ''} ${ann.profiles?.last_name || ''}`.trim()}
                  audience={ann.audience_type}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Megaphone size={18} strokeWidth={1.75} />
                </div>
                <p>No announcements yet. Publish one to keep the school informed.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-lg">
          <div className="card primary-gradient-card">
            <div>
              <div className="flex items-center gap-sm mb-sm text-white-85">
                <TrendingUp size={18} strokeWidth={1.75} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Fee collection
                </span>
              </div>
              <h3 className="text-xl font-bold mb-sm" style={{ color: '#fff' }}>
                {collectionRate.toFixed(1)}% collected
              </h3>
              <p className="text-sm leading-relaxed text-white-85">
                Outstanding: <strong>₦{outstandingFees.toLocaleString()}</strong>
              </p>
            </div>
            <div className="mt-auto pt-lg">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-lg">Quick links</h3>
            <div className="quick-nav">
              <Link href="/dashboard/admin/users" className="quick-nav-link">
                <span>Manage users</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/admin/classes" className="quick-nav-link">
                <span>Classes &amp; subjects</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/admin/timetable" className="quick-nav-link">
                <span>Timetable</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/dashboard/admin/fees" className="quick-nav-link">
                <span>Tuition accounts</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
