'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  Save, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { 
  createFeeRecordAction, 
  updateFeeRecordAction 
} from '@/app/actions';

export default function AdminFeesPage() {
  const supabase = createClient();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [fees, setFees] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');

  // Edit / Input Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form Fields
  const [term, setTerm] = useState('1st Term');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [amountOwed, setAmountOwed] = useState(120000);
  const [amountPaid, setAmountPaid] = useState(0);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // Class fee allocation states
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocClassId, setAllocClassId] = useState('');
  const [allocTerm, setAllocTerm] = useState('1st Term');
  const [allocYearId, setAllocYearId] = useState('');
  const [allocAmount, setAllocAmount] = useState(120000);
  const [allocating, setAllocating] = useState(false);
  const [allocSuccess, setAllocSuccess] = useState('');
  const [allocError, setAllocError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch academic years
      const { data: years } = await supabase
        .from('academic_years')
        .select('*')
        .order('name', { ascending: false });
      if (years) {
        setAcademicYears(years);
        const active = years.find(y => y.is_active);
        if (active) {
          setSelectedYearId(active.id);
          setAllocYearId(active.id);
        } else if (years.length > 0) {
          setSelectedYearId(years[0].id);
          setAllocYearId(years[0].id);
        }
      }

      // 2. Fetch classes
      const { data: clsList } = await supabase.from('classes').select('*').order('name');
      if (clsList) {
        setClasses(clsList);
        if (clsList.length > 0) setAllocClassId(clsList[0].id);
      }

      // 3. Fetch student profiles
      const { data: stdList } = await supabase.from('profiles').select('*').eq('role', 'student').order('first_name');
      if (stdList) setStudents(stdList);

      // 4. Fetch enrollments to know student classes
      const { data: enrollList } = await supabase.from('enrollments').select('*');
      if (enrollList) setEnrollments(enrollList);

      // 5. Fetch fee records
      const { data: feeList } = await supabase.from('fee_records').select('*');
      if (feeList) setFees(feeList);

    } catch (err) {
      console.error('Failed to load fees details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPaymentModal = (student) => {
    setSelectedStudent(student);
    setModalSuccess('');
    setModalError('');

    // Check if there is an existing fee record
    const existing = fees.find(
      f => f.student_id === student.id && f.term === term && f.academic_year_id === selectedYearId
    );

    if (existing) {
      setAmountOwed(existing.amount_owed);
      setAmountPaid(existing.amount_paid);
    } else {
      setAmountOwed(120000);
      setAmountPaid(0);
    }
    setShowModal(true);
  };

  // Re-check existing when term/session changes inside modal
  useEffect(() => {
    if (selectedStudent) {
      const existing = fees.find(
        f => f.student_id === selectedStudent.id && f.term === term && f.academic_year_id === selectedYearId
      );
      if (existing) {
        setAmountOwed(existing.amount_owed);
        setAmountPaid(existing.amount_paid);
      } else {
        setAmountOwed(120000);
        setAmountPaid(0);
      }
    }
  }, [term, selectedYearId, selectedStudent, fees]);

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setModalSuccess(''); setModalError('');

    if (parseFloat(amountPaid) > parseFloat(amountOwed)) {
      setModalError('Amount paid cannot exceed amount owed.');
      return;
    }

    let status = 'unpaid';
    const owed = parseFloat(amountOwed);
    const paid = parseFloat(amountPaid);

    if (paid === owed && owed > 0) status = 'paid';
    else if (paid > 0) status = 'partial';

    // Find if existing to perform update vs create
    const existing = fees.find(
      f => f.student_id === selectedStudent.id && f.term === term && f.academic_year_id === selectedYearId
    );

    let res;
    if (existing) {
      res = await updateFeeRecordAction(existing.id, paid, status);
    } else {
      res = await createFeeRecordAction(selectedStudent.id, term, selectedYearId, owed, paid, status);
    }

    if (res.error) {
      setModalError(res.error);
    } else {
      setModalSuccess('Fee record updated successfully!');
      setTimeout(() => {
        setShowModal(false);
        setSelectedStudent(null);
        loadData();
      }, 800);
    }
  };

  const handleAllocateFees = async (e) => {
    e.preventDefault();
    if (!allocClassId || !allocTerm || !allocYearId || !allocAmount) return;
    setAllocating(true);
    setAllocSuccess('');
    setAllocError('');

    try {
      // 1. Get class name
      const clsName = classes.find(c => c.id === allocClassId)?.name || 'Class';

      // 2. Find enrolled students in class
      const classEnrollments = enrollments.filter(e => e.class_id === allocClassId);
      if (classEnrollments.length === 0) {
        setAllocError(`No students enrolled in class section: ${clsName}`);
        setAllocating(false);
        return;
      }

      let count = 0;
      // 3. Loop and create bill record (using actions or supabase client directly)
      for (const enroll of classEnrollments) {
        const existing = fees.find(
          f => f.student_id === enroll.student_id && f.term === allocTerm && f.academic_year_id === allocYearId
        );
        if (!existing) {
          const res = await createFeeRecordAction(
            enroll.student_id,
            allocTerm,
            allocYearId,
            allocAmount,
            0,
            'unpaid'
          );
          if (!res.error) count++;
        }
      }

      setAllocSuccess(`Successfully issued ₦${parseFloat(allocAmount).toLocaleString()} invoice to ${count} students in ${clsName}!`);
      loadData();
      setTimeout(() => {
        setShowAllocModal(false);
      }, 1500);
    } catch (err) {
      setAllocError(err.message || 'An error occurred during billing allocation.');
    } finally {
      setAllocating(false);
    }
  };

  const getStudentClass = (studentId) => {
    const enroll = enrollments.find(e => e.student_id === studentId);
    if (!enroll) return 'Not Enrolled';
    const cls = classes.find(c => c.id === enroll.class_id);
    return cls ? cls.name : 'Unknown Class';
  };

  // Filter lists
  const filteredStudents = students.filter(s => {
    const studentClassId = enrollments.find(e => e.student_id === s.id)?.class_id || 'none';
    const matchesClass = selectedClassId === 'all' || studentClassId === selectedClassId;
    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesClass && matchesSearch;
  });

  const totalOutstanding = fees.reduce((sum, f) => sum + (parseFloat(f.amount_owed) - parseFloat(f.amount_paid)), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1>Tuition & Financial Ledgers</h1>
          <p>Create class billing bills, record receipt payments, and track outstanding school balances.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ padding: '0.5rem 1rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsl(var(--destructive) / 0.08)', color: 'hsl(var(--destructive))', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertCircle size={15} /> Outstanding Debt: ₦{totalOutstanding.toLocaleString()}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => { setAllocSuccess(''); setAllocError(''); setShowAllocModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Plus size={16} /> Allocate Class Bill
          </button>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="card glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>Class Filter</label>
          <select className="input" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '0.4rem 0.75rem' }}>
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '240px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.3rem' }}>Search student profile...</label>
          <div style={{ position: 'relative' }}>
            <input 
              className="input" 
              placeholder="Search by student name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.4rem 0.75rem 0.4rem 2rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
            <p>Loading financial ledgers...</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class Section</th>
                  <th>Billed (Owed)</th>
                  <th>Collected (Paid)</th>
                  <th>Balance</th>
                  <th>Billing status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => {
                    const records = fees.filter(f => f.student_id === student.id);
                    const owed = records.reduce((sum, r) => sum + parseFloat(r.amount_owed), 0);
                    const paid = records.reduce((sum, r) => sum + parseFloat(r.amount_paid), 0);
                    const balance = owed - paid;

                    let badgeClass = 'badge badge-secondary';
                    let statusLabel = 'No Invoices';
                    if (owed > 0) {
                      if (balance === 0) {
                        badgeClass = 'badge badge-primary';
                        statusLabel = 'Paid';
                      } else if (paid > 0) {
                        badgeClass = 'badge badge-warning';
                        statusLabel = 'Partial';
                      } else {
                        badgeClass = 'badge badge-error';
                        statusLabel = 'Unpaid';
                      }
                    }

                    return (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 650 }}>{student.first_name} {student.last_name}</td>
                        <td><strong>{getStudentClass(student.id)}</strong></td>
                        <td>₦{owed.toLocaleString()}</td>
                        <td>₦{paid.toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: balance > 0 ? 'hsl(var(--destructive))' : 'inherit' }}>
                          ₦{balance.toLocaleString()}
                        </td>
                        <td>
                          <span className={badgeClass} style={{ fontSize: '0.75rem', backgroundColor: statusLabel === 'Paid' ? 'var(--success)' : statusLabel === 'Partial' ? 'var(--warning)' : '', color: statusLabel === 'Paid' || statusLabel === 'Partial' ? 'white' : '' }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleOpenPaymentModal(student)}
                          >
                            Manage Accounts
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No student invoice records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Details & Payment Recording Modal */}
      {showModal && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <form className="card" onSubmit={handleSavePayment} style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Record Payment: {selectedStudent.first_name} {selectedStudent.last_name}</h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            {modalSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <CheckCircle2 size={14} />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={14} />
                <span>{modalError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Billing Term</label>
              <select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Session</label>
              <select className="input" value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Billed (₦)</label>
              <input type="number" className="input" value={amountOwed} onChange={(e) => setAmountOwed(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Amount Collected / Paid (₦)</label>
              <input type="number" className="input" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={16} /> Record Transaction
            </button>
          </form>
        </div>
      )}

      {/* Class Bill Allocation Modal */}
      {showAllocModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <form className="card" onSubmit={handleAllocateFees} style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Allocate Class Bill</h3>
              <button type="button" onClick={() => setShowAllocModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
            </div>

            {allocSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <CheckCircle2 size={14} />
                <span>{allocSuccess}</span>
              </div>
            )}

            {allocError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={14} />
                <span>{allocError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Target Class Section</label>
              <select className="input" value={allocClassId} onChange={(e) => setAllocClassId(e.target.value)} required>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Billing Term</label>
              <select className="input" value={allocTerm} onChange={(e) => setAllocTerm(e.target.value)}>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Session</label>
              <select className="input" value={allocYearId} onChange={(e) => setAllocYearId(e.target.value)}>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Tuition Amount to Bill (₦)</label>
              <input type="number" className="input" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={allocating}>
              {allocating ? 'Processing bills...' : 'Issue Bills Class-wide'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
