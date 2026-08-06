'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Papa from 'papaparse';
import { bulkCreateStudentsAction } from '@/app/actions';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Download, Loader2 } from 'lucide-react';

export default function BulkStudentImportModal({ isOpen, onClose, classes = [], onSuccess }) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileChange = (file) => {
    setGlobalError(null);
    setSubmitResult(null);
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setGlobalError('Please upload a valid CSV file (.csv format only).');
      return;
    }

    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        const rawData = results.data;
        if (!rawData || rawData.length === 0) {
          setGlobalError('The uploaded CSV appears to be completely empty.');
          return;
        }

        const processed = rawData.map((row, idx) => {
          const firstName = row.firstname || row.first_name || row.firstName || row.name || '';
          const lastName = row.lastname || row.last_name || row.lastName || row.surname || '';
          const guardianEmail = row.guardian_email || row.guardianEmail || row.guardianemail || row.parent_email || '';

          const errors = [];
          if (!firstName.trim() && !lastName.trim()) {
            errors.push('Missing student name');
          }

          return {
            originalRow: row,
            rowIndex: idx + 1,
            firstname: firstName.trim() || lastName.trim(),
            lastname: firstName.trim() ? lastName.trim() : '',
            guardian_email: guardianEmail.trim(),
            isValid: errors.length === 0,
            error: errors.join('; ')
          };
        });

        setParsedRows(processed);
      },
      error: (err) => {
        setIsParsing(false);
        setGlobalError(`Error parsing CSV file: ${err.message}`);
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "firstname,lastname,guardian_email\nDavid,Williams,parent.williams@example.com\nAmina,Kalu,\nChinedu,,\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadErrorCsv = (failedRows) => {
    const data = failedRows.map(f => ({
      ...f.row,
      error_reason: f.reason
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'onboarding_error_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      setGlobalError('Please select a target class to enroll these students.');
      return;
    }
    const validStudents = parsedRows.filter((r) => r.isValid);
    if (validStudents.length === 0) {
      setGlobalError('No valid student rows to import.');
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    const payload = validStudents.map(s => ({
      firstname: s.firstname,
      lastname: s.lastname,
      guardian_email: s.guardian_email
    }));

    const res = await bulkCreateStudentsAction(selectedClassId, payload);
    setIsSubmitting(false);

    if (res.error) {
      setGlobalError(res.error);
    } else if (res.success) {
      setSubmitResult(res);
      if (res.createdCount > 0 && onSuccess) {
        onSuccess();
      }
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return createPortal(
    <div className="modal-backdrop" style={{ zIndex: 99999, padding: '1rem' }}>
      <div 
        className="card glass-panel modal-sheet" 
        style={{ 
          width: '100%', 
          maxWidth: '750px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem', marginBottom: '1.25rem', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Bulk Student Onboarding</h3>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
              Upload a CSV file to create accounts and enroll students into a class automatically.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', padding: '0 0.25rem' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {globalError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              ⚠️ {error || globalError}
            </div>
          )}

          {submitResult ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>
                {submitResult.failedCount > 0 ? '⚠️' : '🎉'}
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Onboarding Completed</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Successfully enrolled <strong style={{ color: 'var(--success, #10b981)' }}>{submitResult.createdCount}</strong> students.
                {submitResult.failedCount > 0 && (
                  <span> However, <strong style={{ color: '#ef4444' }}>{submitResult.failedCount}</strong> rows had errors and could not be imported.</span>
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {submitResult.failedCount > 0 && (
                  <button type="button" className="btn btn-secondary" onClick={() => downloadErrorCsv(submitResult.failed)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Download Error Report
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={() => { setSubmitResult(null); setParsedRows([]); onClose(); }}>
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Step 1: Target Class & Template Download */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', background: 'rgba(0, 0, 0, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                <div className="form-group" style={{ flex: '1 1 240px', margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>1. Target Class <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    className="input"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.grade_level ? `(Grade ${c.grade_level})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <button type="button" className="btn btn-secondary" onClick={downloadSampleCsv} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', height: '42px' }}>
                    <Download size={16} /> Sample CSV Template
                  </button>
                </div>
              </div>

              {/* Step 2: File Upload Zone */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>2. Upload Roster CSV</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                    borderRadius: '8px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <div style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                    <Upload size={32} />
                  </div>
                  <p style={{ fontWeight: 600, margin: '0 0 0.25rem', fontSize: '0.95rem' }}>
                    Click to browse or drag and drop CSV file here
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    Required column: <code>firstname</code> • Optional: <code>lastname</code>, <code>guardian_email</code>
                  </p>
                </div>
              </div>

              {/* Step 3: Preview Table */}
              {isParsing && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 size={18} className="animate-spin" /> Parsing CSV file...
                </div>
              )}

              {parsedRows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>3. Roster Preview ({parsedRows.length} rows)</label>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Valid: {validCount}</span>
                      {invalidCount > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>Invalid: {invalidCount}</span>}
                    </div>
                  </div>

                  <div style={{ maxHeight: '240px', overflowX: 'auto', overflowY: 'auto', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', minWidth: '480px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'rgba(0, 0, 0, 0.2)', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '0.6rem 0.75rem' }}>Row</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>First Name</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>Last Name</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>Guardian Email</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))', background: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.08)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(var(--muted-foreground))' }}>#{row.rowIndex}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{row.firstname || <span style={{ color: '#ef4444' }}>Missing</span>}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(var(--muted-foreground))' }}>{row.lastname || '-'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(var(--muted-foreground))' }}>{row.guardian_email || '-'}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              {row.isValid ? (
                                <span style={{ color: '#10b981', fontWeight: 600 }}>Ready</span>
                              ) : (
                                <span style={{ color: '#ef4444', fontWeight: 600 }} title={row.error}>{row.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitResult && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting || parsedRows.length === 0 || validCount === 0 || !selectedClassId}
              onClick={handleSubmit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Onboarding {validCount} Students...
                </>
              ) : (
                <>Confirm & Import ({validCount})</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
