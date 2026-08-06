'use client';

import React, { useState, useTransition } from 'react';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import { resolveAttendanceFlagAction } from '@/app/actions';

export default function NeedsAttentionPanel({ flags }) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState(null);

  const handleResolve = (flagId, status) => {
    setProcessingId(flagId);
    startTransition(async () => {
      await resolveAttendanceFlagAction(flagId, status);
      setProcessingId(null);
    });
  };

  if (!flags || flags.length === 0) return null;

  return (
    <div className="card overflow-hidden !p-0 mb-lg border-destructive/20 shadow-sm">
      <div className="bg-destructive/5 p-md border-b border-destructive/10 flex items-center gap-sm">
        <AlertTriangle size={18} className="text-destructive" strokeWidth={2.5} />
        <h3 className="text-base font-semibold mb-0 text-destructive">Needs attention</h3>
      </div>
      
      <div className="p-md bg-white">
        <p className="text-sm text-muted-foreground mb-md">
          These students have triggered an automatic attendance anomaly alert. Please review their records and follow up.
        </p>

        <div className="flex flex-col">
          {flags.map((flag, index) => (
            <div 
              key={flag.id} 
              className={`flex justify-between items-start md:items-center py-md flex-col md:flex-row gap-md ${index !== flags.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div>
                <p className="font-semibold text-foreground mb-xs">
                  {flag.profiles?.first_name} {flag.profiles?.last_name}
                </p>
                <div className="flex items-center gap-sm flex-wrap mt-1">
                  <span className={`badge ${flag.flag_type === 'spike' ? 'badge-danger' : 'badge-warning'} text-[10px] uppercase tracking-widest font-bold py-0.5 px-2`}>
                    {flag.flag_type}
                  </span>
                  <span className="text-sm text-muted-foreground">{flag.reason}</span>
                </div>
              </div>
              
              <div className="flex gap-sm self-end md:self-auto shrink-0">
                <button 
                  onClick={() => handleResolve(flag.id, 'reviewed')}
                  disabled={isPending && processingId === flag.id}
                  className="btn btn-outline btn-sm font-medium"
                  title="Mark as reviewed (will keep monitoring)"
                >
                  {isPending && processingId === flag.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Reviewed
                </button>
                <button 
                  onClick={() => handleResolve(flag.id, 'dismissed')}
                  disabled={isPending && processingId === flag.id}
                  className="btn btn-ghost btn-sm text-muted-foreground hover:text-destructive font-medium"
                  title="Dismiss this alert"
                >
                  <X size={14} />
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
