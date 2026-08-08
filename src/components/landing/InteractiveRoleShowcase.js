'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  Users, 
  Award, 
  CreditCard, 
  Clock, 
  Volume2, 
  Maximize2 
} from 'lucide-react';

export default function InteractiveRoleShowcase() {
  const [activeRole, setActiveRole] = useState('cbt_proctor');
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const [noiseSpikes, setNoiseSpikes] = useState(0);
  const [examTime, setExamTime] = useState(1420);

  const handleSimulateTabSwitch = () => {
    setTabSwitchViolations((prev) => prev + 1);
  };

  const handleSimulateNoiseSpike = () => {
    setNoiseSpikes((prev) => prev + 1);
  };

  const resetSimulator = () => {
    setTabSwitchViolations(0);
    setNoiseSpikes(0);
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section id="portals" className="py-5xl px-lg bg-transparent border-b border-border">
      <div className="container max-w-hero">
        <div className="text-center mb-3xl">
          <span className="executive-badge mb-sm">
            <span className="gold-dot" />
            <span>Interactive Institutional Sandbox</span>
          </span>
          <h2 className="text-section-title mb-sm text-foreground">
            Test Drive Roles &amp; CBT Anti-Cheat Proctored Exams
          </h2>
          <p className="text-section-subtitle max-w-subtitle mx-auto font-normal text-muted-foreground">
            Experience how IMP3RIAL EDU operates live for School Principals, Teachers, Students, and Parents.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex flex-wrap justify-center gap-xs sm:gap-sm mb-2xl">
          <button
            type="button"
            className={`hero-tab-btn ${activeRole === 'cbt_proctor' ? 'active' : ''}`}
            onClick={() => setActiveRole('cbt_proctor')}
          >
            Live CBT Anti-Cheat Simulator
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
          >
            School Admin Hub
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeRole === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveRole('teacher')}
          >
            Teacher Gradebook
          </button>
          <button
            type="button"
            className={`hero-tab-btn ${activeRole === 'parent' ? 'active' : ''}`}
            onClick={() => setActiveRole('parent')}
          >
            Parent Portal
          </button>
        </div>

        {/* Interactive View Display */}
        <div className="glass-panel p-lg sm:p-2xl rounded-xl border border-white/10 shadow-xl">
          {activeRole === 'cbt_proctor' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg border-b border-border pb-md">
                <div>
                  <div className="flex items-center gap-xs text-xs font-bold uppercase tracking-wide text-amber-600">
                    <CheckCircle size={14} /> Live Proctored Exam Engine
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Mid-Term Mathematics Online Examination</h3>
                </div>
                <div className="flex items-center gap-md px-md py-xs rounded bg-secondary text-secondary-foreground">
                  <Clock size={16} className="text-primary" />
                  <span className="font-mono font-bold text-sm">Time Remaining: {formatTimer(examTime)}</span>
                </div>
              </div>

              <div className="grid-split-5-7">
                {/* Simulator Controls & Violations Monitor */}
                <div className="proctor-sim-screen flex flex-col justify-between bg-slate-900 border-slate-800 w-full">
                  <div>
                    <div className="flex justify-between items-center pb-sm border-b border-slate-800 mb-md">
                      <span className="text-xs text-slate-400 font-semibold uppercase">Proctor Security Status</span>
                      <span className="text-xs font-bold text-emerald-400 px-xs py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">
                        MONITORING ACTIVE
                      </span>
                    </div>

                    <div className="space-y-sm text-sm">
                      <div className="flex justify-between items-center p-sm bg-slate-800/80 rounded border border-slate-700">
                        <span className="flex items-center gap-xs text-slate-300">
                          <Maximize2 size={15} /> Tab Switch Violations:
                        </span>
                        <span className={`font-mono font-bold ${tabSwitchViolations > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                          {tabSwitchViolations} / 3 Max
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-sm bg-slate-800/80 rounded border border-slate-700">
                        <span className="flex items-center gap-xs text-slate-300">
                          <Volume2 size={15} /> Noise Spikes Detected:
                        </span>
                        <span className={`font-mono font-bold ${noiseSpikes > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                          {noiseSpikes}
                        </span>
                      </div>
                    </div>

                    {tabSwitchViolations > 0 && (
                      <div className="proctor-alert-box">
                        <ShieldAlert size={20} className="shrink-0" />
                        <div>
                          <strong>Anti-Cheat Warning Triggered!</strong> Candidate lost window focus ({tabSwitchViolations}x log saved).
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-md mt-md border-t border-slate-800 space-y-xs">
                    <span className="text-xs text-slate-400 font-semibold block mb-xs">Interactive Test Actions:</span>
                    <div className="flex flex-wrap gap-xs">
                      <button
                        type="button"
                        onClick={handleSimulateTabSwitch}
                        className="btn btn-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold"
                      >
                        Simulate Tab Switch
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateNoiseSpike}
                        className="btn btn-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold"
                      >
                        Simulate Noise Spike
                      </button>
                      <button
                        type="button"
                        onClick={resetSimulator}
                        className="btn btn-xs bg-slate-700 text-slate-200 hover:bg-slate-600 font-semibold"
                      >
                        Reset Demo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Candidate Mock Exam Window */}
                <div className="card p-lg bg-card border border-border w-full">
                  <span className="text-xs font-semibold block mb-xs text-muted-foreground">
                    Question 4 of 25 · Algebra &amp; Functions
                  </span>
                  <h4 className="text-base font-bold mb-md text-foreground">
                    Solve for x in the equation: 3(x - 4) + 8 = 2x + 11
                  </h4>

                  <div className="space-y-sm mb-lg">
                    {['x = 9', 'x = 15', 'x = 7', 'x = 12'].map((option, idx) => (
                      <label
                        key={option}
                        className={`flex items-center gap-md p-md rounded border cursor-pointer transition-colors ${
                          idx === 1 ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <input type="radio" name="cbt_option" defaultChecked={idx === 1} className="text-primary" />
                        <span>Option {String.fromCharCode(65 + idx)}: {option}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-sm border-t border-border text-muted-foreground">
                    <span>Auto-Save: Active</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-xs">
                      <CheckCircle size={14} /> Answer Logged Instantly
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeRole === 'admin' && (
            <div className="space-y-lg">
              <div className="flex justify-between items-center border-b border-border pb-md">
                <div>
                  <span className="text-xs font-bold text-primary uppercase">Institutional Command Center</span>
                  <h3 className="text-xl font-bold text-foreground">School Overview &amp; RLS Multi-Tenant Data Isolation</h3>
                </div>
                <span className="badge-pill font-bold border bg-secondary text-secondary-foreground border-border">
                  Tenant Data Protected
                </span>
              </div>

              <div className="grid-3col">
                <div className="glass-panel p-md rounded-lg">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="text-xs font-semibold text-muted-foreground">Tuition Revenue</span>
                    <CreditCard size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-foreground">₦14,850,000</div>
                  <span className="text-xs font-medium text-emerald-600">94.2% collected term 2</span>
                </div>

                <div className="glass-panel p-md rounded-lg">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="text-xs font-semibold text-muted-foreground">Active Students</span>
                    <Users size={16} className="text-primary" />
                  </div>
                  <div className="text-xl font-black text-foreground">428 Enrolled</div>
                  <span className="text-xs font-medium text-muted-foreground">Across 14 classrooms</span>
                </div>

                <div className="glass-panel p-md rounded-lg">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="text-xs font-semibold text-muted-foreground">Proctored Exams</span>
                    <Award size={16} className="text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-foreground">18 Scheduled</div>
                  <span className="text-xs font-medium text-amber-600">0 security breaches</span>
                </div>
              </div>
            </div>
          )}

          {activeRole === 'teacher' && (
            <div className="space-y-md">
              <div className="flex justify-between items-center border-b border-border pb-md">
                <div>
                  <span className="text-xs font-bold uppercase text-primary">Teacher Gradebook</span>
                  <h3 className="text-xl font-bold text-foreground">Class SS2 Science — Term Grade Compilation</h3>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Term 2 Sheet</span>
              </div>

              <div className="comparison-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Continuous Assessment (40%)</th>
                      <th>CBT Exam (60%)</th>
                      <th>Total Score</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold text-foreground">Amina Bello</td>
                      <td>36 / 40</td>
                      <td>54 / 60</td>
                      <td className="font-bold text-emerald-600">90%</td>
                      <td><span className="px-xs py-0.5 rounded font-bold text-xs bg-secondary text-secondary-foreground">A1</span></td>
                    </tr>
                    <tr>
                      <td className="font-bold text-foreground">David Okafor</td>
                      <td>31 / 40</td>
                      <td>48 / 60</td>
                      <td className="font-bold text-primary">79%</td>
                      <td><span className="px-xs py-0.5 rounded font-bold text-xs bg-secondary text-secondary-foreground">B2</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeRole === 'parent' && (
            <div className="space-y-md">
              <div className="flex justify-between items-center border-b border-border pb-md">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-600">Parent Portal</span>
                  <h3 className="text-xl font-bold text-foreground">Student: Chidi Okafor (Grade 10)</h3>
                </div>
                <span className="badge-pill font-bold border bg-secondary text-secondary-foreground border-border">
                  Real-Time Linked Profile
                </span>
              </div>

              <div className="grid-2col">
                <div className="glass-panel p-md rounded-lg">
                  <span className="text-xs font-semibold block mb-xs text-muted-foreground">Attendance Record</span>
                  <div className="text-lg font-bold text-emerald-600">98% Present This Term</div>
                  <p className="text-xs mt-xs text-muted-foreground">Zero unexcused absences recorded by classroom teacher.</p>
                </div>
                <div className="glass-panel p-md rounded-lg">
                  <span className="text-xs font-semibold block mb-xs text-muted-foreground">Tuition Status</span>
                  <div className="text-lg font-bold text-primary">Paid In Full (Term 2)</div>
                  <p className="text-xs mt-xs text-muted-foreground">Receipt #INV-2026-894 generated automatically.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
