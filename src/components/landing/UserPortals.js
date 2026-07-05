import React from 'react';
import { ShieldCheck, UserCheck, BarChart3, Users } from 'lucide-react';

export default function UserPortals() {
  const portals = [
    {
      text: "Administrators configure courses, register classes, and set up user profiles.",
      icon: UserCheck,
      colorClass: "stat-icon-indigo"
    },
    {
      text: "Teachers record daily attendance logs and input term scores in seconds.",
      icon: BarChart3,
      colorClass: "stat-icon-violet"
    },
    {
      text: "Students check report cards, view attendance summaries, and stay updated.",
      icon: Users,
      colorClass: "stat-icon-emerald"
    }
  ];

  return (
    <section className="py-5xl px-lg bg-muted-glass">
      <div className="container max-w-section">
        <div className="grid-auto-fit-lg items-center">
          <div>
            <h2 className="text-section-title-md mb-lg">
              Tailored portals for every user
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

          <div className="card glass-panel">
            <h3 className="text-sm-medium font-bold mb-md flex items-center gap-sm">
              <ShieldCheck size={20} className="text-foreground" /> Security & Reliability
            </h3>
            <div className="flex flex-col gap-sm my-sm">
              <div className="flex justify-between py-sm border-b">
                <span className="font-medium text-foreground">Uptime Guarantee</span>
                <span className="text-muted">99.99%</span>
              </div>
              <div className="flex justify-between py-sm border-b">
                <span className="font-medium text-foreground">Data Encryption</span>
                <span className="text-muted">AES-256</span>
              </div>
              <div className="flex justify-between py-sm">
                <span className="font-medium text-foreground">Automated Backups</span>
                <span className="text-muted">Daily</span>
              </div>
            </div>
            <p className="text-xs mt-md text-muted">
              Your school records are fully encrypted and backed up daily. We implement multi-layered compliance controls to keep information safe.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
