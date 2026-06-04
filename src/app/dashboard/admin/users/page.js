'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { createUserAccount, deleteUserAction } from '@/app/actions';
import { Users, UserPlus, ShieldAlert, CheckCircle2, Loader2, Mail, BadgeCheck, Trash2 } from 'lucide-react';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Form states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('first_name', { ascending: true });

    if (!error) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const role = formData.get('role');

    startTransition(async () => {
      const result = await createUserAccount(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`Successfully provisioned new ${role} account (${email})!`);
        event.target.reset();
        fetchUsers(); // Refresh the grid
      }
    });
  };

  // Delete profile (Admin only)
  const handleDelete = async (id, name, userRole) => {
    if (!confirm(`Are you sure you want to delete the user account for ${name}?`)) return;
    
    const result = await deleteUserAction(id);
    if (result?.error) {
      alert(`Delete failed: ${result.error}`);
    } else {
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter === 'all') return true;
    return user.role === roleFilter;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>User Accounts Directory</h1>
        <p>Manage credentials, roles, and schools assignments.</p>
      </div>

      <div className="responsive-grid-3-2">
        {/* Users Directory */}
        <div>
          {/* Filters */}
          <div className="filter-group">
            <button 
              className={`filter-pill ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All Accounts ({users.length})
            </button>
            <button 
              className={`filter-pill ${roleFilter === 'teacher' ? 'active' : ''}`}
              onClick={() => setRoleFilter('teacher')}
            >
              Teachers ({users.filter(u => u.role === 'teacher').length})
            </button>
            <button 
              className={`filter-pill ${roleFilter === 'student' ? 'active' : ''}`}
              onClick={() => setRoleFilter('student')}
            >
              Students ({users.filter(u => u.role === 'student').length})
            </button>
          </div>

          {/* Directory Card */}
          <div className="table-container">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="animate-spin" />
                <span>Fetching tenant directory...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>
                        {user.first_name} {user.last_name}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'hsl(var(--muted-foreground))' }}>
                          <Mail size={14} /> {user.email}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          user.role === 'admin' ? 'badge-danger' : 
                          user.role === 'teacher' ? 'badge-primary' : 'badge-secondary'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.role !== 'admin' && (
                          <button 
                            className="btn btn-ghost" 
                            style={{ color: 'hsl(var(--destructive))', padding: '0.375rem' }}
                            onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`, user.role)}
                            title="Delete User Account"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Users size={24} />
                </div>
                <p>No accounts matching filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Provisioning form */}
        <div>
          <div className="card glass-panel" style={{ position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon stat-icon-indigo" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <UserPlus size={18} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Provision User Account</h3>
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

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First Name</label>
                  <input className="input" id="firstName" name="firstName" type="text" placeholder="John" required disabled={isPending} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last Name</label>
                  <input className="input" id="lastName" name="lastName" type="text" placeholder="Smith" required disabled={isPending} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input className="input" id="email" name="email" type="email" placeholder="john.smith@school.edu" required disabled={isPending} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Temporary Password</label>
                <input className="input" id="password" name="password" type="password" placeholder="••••••••" required disabled={isPending} />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="role">System Role</label>
                <select className="input" id="role" name="role" required disabled={isPending}>
                  <option value="teacher">Teacher (Class & Grades access)</option>
                  <option value="student">Student (Grades & Attendance viewing)</option>
                </select>
              </div>

              <button className="btn btn-primary" type="submit" disabled={isPending} style={{ width: '100%' }}>
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <BadgeCheck size={16} />
                    Provision Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
