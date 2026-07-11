import React from 'react';
import { ShieldCheck, UserCheck, BarChart3, Users } from 'lucide-react';

export default function UserPortals() {
  const portals = [
    {
      text: "Administrators manage academic cycles, configure courses, track tuition billings, and register staff.",
      icon: UserCheck,
      colorClass: "stat-icon-indigo"
    },
    {
      text: "Teachers record daily attendance, manage grade sheets, post assignments, and print term sheets in seconds.",
      icon: BarChart3,
      colorClass: "stat-icon-violet"
    },
    {
      text: "Students & Parents access report cards, check attendance summaries, and stay aligned with course progress.",
      icon: Users,
      colorClass: "stat-icon-emerald"
    }
  ];

  return (
    <section id="portals" className="py-5xl px-lg bg-muted-glass">
      <div className="container max-w-section">
        <div className="grid-auto-fit-lg items-center">
          <div>
            <h2 className="text-section-title-md mb-lg">
              Tailored portals for every stakeholder
            </h2>
            <div className="flex flex-col gap-lg">
              {portals.map((portal, idx) => (
                <div key={idx} className="flex gap-md items-center">
                  <div className={`stat-icon ${portal.colorClass}`}>
                    <portal.icon size={18} />
                  </div>
                  <span className="text-sm-medium">{portal.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="security" className="card glass-panel">
            <h3 className="text-sm-medium font-bold mb-md flex items-center gap-sm">
              <ShieldCheck size={20} style={{ color: 'hsl(var(--primary))' }} /> School Safety & Trust
            </h3>
            <div className="flex flex-col gap-sm my-sm">
              <div className="flex justify-between py-sm border-b">
                <span className="font-medium text-foreground">Student Record Privacy</span>
                <span className="text-muted">Only authorized views</span>
              </div>
              <div className="flex justify-between py-sm border-b">
                <span className="font-medium text-foreground">Safe Invoicing & Fees</span>
                <span className="text-muted">Bank-level encryption</span>
              </div>
              <div className="flex justify-between py-sm">
                <span className="font-medium text-foreground">Daily Automatic Backups</span>
                <span className="text-muted">Zero risk of score loss</span>
              </div>
            </div>
            <p className="text-xs mt-md text-muted" style={{ lineHeight: '1.6' }}>
              We protect your school's records like a bank protects accounts. Grades, student profiles, and billing logs are kept private, locked from outsiders, and backed up automatically every single night.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
