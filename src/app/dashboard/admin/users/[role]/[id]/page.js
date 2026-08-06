import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { getUserProfileMetrics } from '@/app/actions';
import StudentProfileCard from '@/components/profile/StudentProfileCard';
import TeacherProfileCard from '@/components/profile/TeacherProfileCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUserProfilePage({ params }) {
  const { role, id } = await params;
  
  if (role !== 'student' && role !== 'teacher') {
    redirect('/dashboard/admin/users');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch target profile securely
  const { data: targetProfile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (pErr || !targetProfile) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">User not found or access denied.</div>
        <Link href="/dashboard/admin/users" className="btn btn-secondary mt-4">Go Back</Link>
      </div>
    );
  }

  // Fetch metrics securely using action
  const metricsRes = await getUserProfileMetrics(id);
  
  if (metricsRes.error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">{metricsRes.error}</div>
        <Link href="/dashboard/admin/users" className="btn btn-secondary mt-4">Go Back</Link>
      </div>
    );
  }

  let classes = [];
  let currentClassId = '';
  let guardianEmail = '';

  if (role === 'student') {
    const { data: classData } = await supabase.from('classes').select('id, name, grade_level').order('name');
    classes = classData || [];

    const { data: enrollData } = await supabase.from('enrollments').select('class_id').eq('student_id', id).limit(1).maybeSingle();
    if (enrollData?.class_id) {
      currentClassId = enrollData.class_id;
    }

    const { data: parentLink } = await supabase.from('parent_student').select('parent_id').eq('student_id', id).limit(1).maybeSingle();
    if (parentLink?.parent_id) {
      const { data: parentProfile } = await supabase.from('profiles').select('email').eq('id', parentLink.parent_id).single();
      if (parentProfile?.email) {
        guardianEmail = parentProfile.email;
      }
    }
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/dashboard/admin/users" className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Users
          </Link>
          <h1 className="dashboard-title">User Profile</h1>
          <p className="dashboard-subtitle">Comprehensive performance summary and metrics.</p>
        </div>
      </div>

      {role === 'student' ? (
        <StudentProfileCard 
          profile={targetProfile} 
          metrics={metricsRes.metrics}
          isAdmin={true}
          availableClasses={classes}
          initialClassId={currentClassId}
          initialGuardianEmail={guardianEmail}
        />
      ) : (
        <TeacherProfileCard profile={targetProfile} metrics={metricsRes.metrics} />
      )}
    </div>
  );
}
