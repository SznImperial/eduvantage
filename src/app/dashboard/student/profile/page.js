import React from 'react';
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { getUserProfileMetrics } from '@/app/actions';
import StudentProfileCard from '@/components/profile/StudentProfileCard';

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch target profile securely
  const { data: targetProfile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (pErr || !targetProfile || targetProfile.role !== 'student') {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">User not found or access denied.</div>
      </div>
    );
  }

  // Fetch metrics securely using action
  const metricsRes = await getUserProfileMetrics(user.id);
  
  if (metricsRes.error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">{metricsRes.error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="dashboard-title">My Profile</h1>
          <p className="dashboard-subtitle">Track your progress and performance metrics to see where you can improve.</p>
        </div>
      </div>

      <StudentProfileCard profile={targetProfile} metrics={metricsRes.metrics} />
    </div>
  );
}
