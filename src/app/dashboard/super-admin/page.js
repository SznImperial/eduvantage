'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { updateSubscriptionAction } from '@/app/actions';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Search, 
  ShieldAlert, 
  CheckCircle,
  Loader2,
  Lock,
  Globe,
  Settings,
  ArrowUpRight
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const supabase = createClient();
  const [schools, setSchools] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [newTier, setNewTier] = useState('free');
  const [newBillingCycle, setNewBillingCycle] = useState('annual');
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: schoolsData, error: sErr } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    const { data: profilesData, error: pErr } = await supabase.from('profiles').select('school_id, role');

    if (!sErr && schoolsData) setSchools(schoolsData);
    if (!pErr && profilesData) setProfiles(profilesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTier = async (schoolId, tier) => {
    setError('');
    setSuccess('');
    startTransition(async () => {
      const res = await updateSubscriptionAction(schoolId, tier);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Subscription tier updated successfully!');
        setSelectedSchool(null);
        fetchData();
      }
    });
  };

  // Helper calculations
  const totalSchools = schools.length;
  
  const studentCountBySchool = (schoolId) => profiles.filter(p => p.school_id === schoolId && p.role === 'student').length;
  const teacherCountBySchool = (schoolId) => profiles.filter(p => p.school_id === schoolId && p.role === 'teacher').length;
  const totalUserCount = profiles.length;

  const activeSubscriptions = schools.filter(s => s.subscription_tier !== 'free').length;

  // Calculate ARR and MRR (billing-cycle aware)
  const arr = schools.reduce((acc, school) => {
    const cycle = school.billing_cycle || 'annual';
    if (school.subscription_tier === 'starter') return acc + (cycle === 'monthly' ? 480000 : 450000);
    if (school.subscription_tier === 'growth') return acc + (cycle === 'monthly' ? 720000 : 700000);
    if (school.subscription_tier === 'enterprise') return acc + (cycle === 'monthly' ? 1320000 : 1300000);
    return acc;
  }, 0);
  const mrr = Math.round(arr / 12);

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Doughnut chart metrics
  const starterCount = schools.filter(s => s.subscription_tier === 'starter').length;
  const growthCount = schools.filter(s => s.subscription_tier === 'growth').length;
  const enterpriseCount = schools.filter(s => s.subscription_tier === 'enterprise').length;
  const freeCount = schools.filter(s => s.subscription_tier === 'free').length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>SaaS Control Plane</h1>
          <p>Global multi-tenant metrics, billing statistics, and workspace state configurations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'hsl(var(--muted))', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.35rem 0.75rem', backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'hsl(var(--foreground))', boxShadow: 'var(--shadow-sm)' }}>
            <Globe size={14} /> Mainnet Live
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon stat-icon-indigo">
              <Building2 size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tenants</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.125rem' }}>{totalSchools}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            <span>Active Subscriptions</span>
            <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{activeSubscriptions} ({((activeSubscriptions / (totalSchools || 1)) * 100).toFixed(0)}%)</span>
          </div>
        </div>

        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon stat-icon-emerald">
              <DollarSign size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Recurring Revenue</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.125rem' }}>₦{mrr.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            <span>Projected Annual ARR</span>
            <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>₦{arr.toLocaleString()}</span>
          </div>
        </div>

        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon stat-icon-violet">
              <Users size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Users</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.125rem' }}>{totalUserCount}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
            <span>Student : Teacher Ratio</span>
            <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {(profiles.filter(p => p.role === 'student').length / (profiles.filter(p => p.role === 'teacher').length || 1)).toFixed(1)} : 1
            </span>
          </div>
        </div>
      </div>

      <div className="responsive-grid-2-1" style={{ marginBottom: '2rem' }}>
        {/* Tenants Database table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tenant Workspaces</h3>
            <div className="form-group" style={{ margin: 0, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
              <input 
                type="text" 
                placeholder="Search schools by name or slug..." 
                className="input" 
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '36px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <CheckCircle size={14} />
              <span>{success}</span>
            </div>
          )}

          <div className="table-container">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="animate-spin" />
                <span>Syncing platform registry...</span>
              </div>
            ) : filteredSchools.length > 0 ? (
              <table className="table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>School Info</th>
                    <th>Students</th>
                    <th>Classes</th>
                    <th>Plan Tier</th>
                    <th>Billing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map((school) => {
                    const students = studentCountBySchool(school.id);
                    const teachers = teacherCountBySchool(school.id);
                    const tierName = school.subscription_tier || 'free';
                    return (
                      <tr key={school.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{school.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>/{school.slug}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 650 }}>{students}</span>
                            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}> / {school.max_student_limit}</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span>{teachers} teachers</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            tierName === 'enterprise' ? 'badge-primary' : 
                            tierName === 'growth' ? 'badge-indigo' : 
                            tierName === 'starter' ? 'badge-secondary' : 'badge-ghost'
                          }`} style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            {tierName}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                            {tierName === 'free' ? 'N/A' : (school.billing_cycle ? school.billing_cycle.charAt(0).toUpperCase() + school.billing_cycle.slice(1) : 'N/A')}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            onClick={() => {
                              setSelectedSchool(school);
                              setNewTier(school.subscription_tier || 'free');
                              setNewBillingCycle(school.billing_cycle || 'annual');
                            }}
                          >
                            Manage Plan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Building2 size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p>No tenant workspaces registered.</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plan Distribution Chart Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Subscription Mix</h3>

          {/* Render SVG Pie Chart */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <svg width="160" height="160" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              {/* Free Segment */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--border))" strokeWidth="3.5" />
              
              {/* Subscription distribution visuals */}
              {totalSchools > 0 && (() => {
                const total = totalSchools;
                const freePct = (freeCount / total) * 100;
                const starterPct = (starterCount / total) * 100;
                const growthPct = (growthCount / total) * 100;
                const enterprisePct = (enterpriseCount / total) * 100;

                let offset = 0;
                
                return (
                  <>
                    {/* Starter (Gray Accent / Silver) */}
                    {starterCount > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6b7280" strokeWidth="3.8" 
                        strokeDasharray={`${starterPct} ${100 - starterPct}`} 
                        strokeDashoffset={100 - offset}
                        style={{ transition: 'stroke-dasharray 0.3s' }}
                      />
                    )}
                    {/* Growth (Indigo Accent) */}
                    {growthCount > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4f46e5" strokeWidth="3.8" 
                        strokeDasharray={`${growthPct} ${100 - growthPct}`} 
                        strokeDashoffset={100 - (offset += starterPct)}
                        style={{ transition: 'stroke-dasharray 0.3s' }}
                      />
                    )}
                    {/* Enterprise (Black Accent) */}
                    {enterpriseCount > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#111827" strokeWidth="3.8" 
                        strokeDasharray={`${enterprisePct} ${100 - enterprisePct}`} 
                        strokeDashoffset={100 - (offset += growthPct)}
                        style={{ transition: 'stroke-dasharray 0.3s' }}
                      />
                    )}
                  </>
                );
              })()}
              
              {/* Inner Circle text */}
              <g style={{ transform: 'rotate(90deg) translate(0px, -36px)' }}>
                <text x="18" y="16.5" textAnchor="middle" fontSize="3" fontWeight="bold" fill="hsl(var(--foreground))">
                  {((activeSubscriptions / (totalSchools || 1)) * 100).toFixed(0)}%
                </text>
                <text x="18" y="21.5" textAnchor="middle" fontSize="2" fill="hsl(var(--muted-foreground))" fontWeight="500">
                  Paid Sub
                </text>
              </g>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#111827' }} />
                <span>Enterprise</span>
              </div>
              <span style={{ fontWeight: 600 }}>{enterpriseCount} schools</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                <span>Growth</span>
              </div>
              <span style={{ fontWeight: 600 }}>{growthCount} schools</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6b7280' }} />
                <span>Starter</span>
              </div>
              <span style={{ fontWeight: 600 }}>{starterCount} schools</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', borderTop: '1px dashed hsl(var(--border))', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'hsl(var(--border))' }} />
                <span>Free Trial / Tier</span>
              </div>
              <span style={{ fontWeight: 600 }}>{freeCount} schools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Edit Dialog / Side panel */}
      {selectedSchool && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', margin: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Manage Subscription</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
              Update subscription configurations for <strong>{selectedSchool.name}</strong> workspace.
            </p>

            <div className="form-group">
              <label className="form-label">Pricing Tier Plan</label>
              <select 
                className="input" 
                value={newTier} 
                onChange={(e) => setNewTier(e.target.value)}
                disabled={isPending}
              >
                <option value="free">Free Tier (10 students limit, 3 classes)</option>
                <option value="starter">Starter Plan (100 students limit, 10 classes)</option>
                <option value="growth">Growth Plan (500 students limit, 40 classes)</option>
                <option value="enterprise">Enterprise Plan (Unlimited students/classes)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Billing Cycle</label>
              <select className="input" value={newBillingCycle} onChange={(e) => setNewBillingCycle(e.target.value)} disabled={isPending}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1 }}
                onClick={() => setSelectedSchool(null)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => handleUpdateTier(selectedSchool.id, newTier)}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Apply Plan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
