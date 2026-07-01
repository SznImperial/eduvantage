'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { CreditCard, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export default function StudentFeesPage() {
  const supabase = createClient();
  const [feeRecords, setFeeRecords] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch academic years
      const { data: years } = await supabase.from('academic_years').select('*');
      if (years) setAcademicYears(years);

      // 2. Fetch fee records for this student
      const { data: fees } = await supabase
        .from('fee_records')
        .select('*')
        .eq('student_id', user.id);
      
      if (fees) setFeeRecords(fees);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getYearName = (yearId) => {
    const y = academicYears.find(x => x.id === yearId);
    return y ? y.name : 'Unknown Session';
  };

  // Compute totals
  const totalBilled = feeRecords.reduce((sum, f) => sum + parseFloat(f.amount_owed), 0);
  const totalPaid = feeRecords.reduce((sum, f) => sum + parseFloat(f.amount_paid), 0);
  const totalBalance = totalBilled - totalPaid;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Financial Account Ledger</h1>
        <p>Review school fee payments, term invoice receipts, and check outstanding debt balances.</p>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
            <p>Loading financial accounts...</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Cards */}
          <div className="responsive-grid-1-1">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="stat-icon stat-icon-indigo" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                <CreditCard size={24} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Total Invoiced</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.15rem' }}>₦{totalBilled.toLocaleString()}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="stat-icon stat-icon-emerald" style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'hsl(var(--success) / 0.15)' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Total Collected / Paid</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--success)' }}>₦{totalPaid.toLocaleString()}</h3>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="stat-icon stat-icon-rose" style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'hsl(var(--destructive) / 0.15)' }}>
                <AlertCircle size={24} style={{ color: 'hsl(var(--destructive))' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Outstanding Balance</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.15rem', color: 'hsl(var(--destructive))' }}>₦{totalBalance.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'hsl(var(--muted) / 0.15)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Invoices & Receipts Ledger</h3>
            </div>
            
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Billing Term</th>
                    <th>Academic Session</th>
                    <th>Amount Billed (Owed)</th>
                    <th>Amount Paid</th>
                    <th>Remaining Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRecords.length > 0 ? (
                    feeRecords.map(record => {
                      const balance = parseFloat(record.amount_owed) - parseFloat(record.amount_paid);
                      let badgeClass = 'badge badge-secondary';
                      if (record.status === 'paid') badgeClass = 'badge badge-primary';
                      else if (record.status === 'partial') badgeClass = 'badge badge-warning';
                      else if (record.status === 'unpaid') badgeClass = 'badge badge-error';

                      return (
                        <tr key={record.id}>
                          <td style={{ fontWeight: 650 }}>{record.term}</td>
                          <td><strong>{getYearName(record.academic_year_id)}</strong></td>
                          <td>₦{parseFloat(record.amount_owed).toLocaleString()}</td>
                          <td>₦{parseFloat(record.amount_paid).toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: balance > 0 ? 'hsl(var(--destructive))' : 'inherit' }}>
                            ₦{balance.toLocaleString()}
                          </td>
                          <td>
                            <span className={badgeClass} style={{ fontSize: '0.75rem', backgroundColor: record.status === 'paid' ? 'var(--success)' : record.status === 'partial' ? 'var(--warning)' : '', color: record.status === 'paid' || record.status === 'partial' ? 'white' : '' }}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No bills or financial invoice transactions issued to your account.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
