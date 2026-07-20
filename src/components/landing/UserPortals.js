import React from 'react';
import { ShieldCheck, UserCheck, BarChart3, Users } from 'lucide-react';

export default function UserPortals() {
  const portals = [
    {
      title: 'Administrators',
      text: 'Manage academic cycles, configure courses, track tuition billing, and register staff.',
      icon: UserCheck,
      colorClass: 'stat-icon-indigo',
    },
    {
      title: 'Teachers',
      text: 'Record attendance, manage grade sheets, post assignments, and publish term results.',
      icon: BarChart3,
      colorClass: 'stat-icon-violet',
    },
    {
      title: 'Students & parents',
      text: 'Access report cards, review attendance, and stay aligned with course progress.',
      icon: Users,
      colorClass: 'stat-icon-emerald',
    },
  ];

  return (
    <section id="portals" className="py-5xl px-lg bg-muted-glass">
      <div className="container max-w-section">
        <div className="grid-auto-fit-lg items-center">
          <div>
            <h2 className="text-section-title-md mb-lg">
              Portals tailored to every role
            </h2>
            <div className="flex flex-col">
              {portals.map((portal) => (
                <div key={portal.title} className="portal-row">
                  <div className={`stat-icon ${portal.colorClass}`}>
                    <portal.icon size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-xs">{portal.title}</h3>
                    <p>{portal.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="security" className="card">
            <h3 className="text-sm-medium font-bold mb-md flex items-center gap-sm">
              <ShieldCheck size={18} className="text-primary" strokeWidth={1.75} />
              Safety &amp; trust
            </h3>
            <div className="flex flex-col">
              <div className="security-row">
                <span className="font-medium text-foreground text-sm">Student record privacy</span>
                <span className="text-muted text-xs">Authorized access only</span>
              </div>
              <div className="security-row">
                <span className="font-medium text-foreground text-sm">Fees &amp; invoicing</span>
                <span className="text-muted text-xs">Encrypted payments</span>
              </div>
              <div className="security-row">
                <span className="font-medium text-foreground text-sm">Daily backups</span>
                <span className="text-muted text-xs">Protected academic data</span>
              </div>
            </div>
            <p className="text-xs mt-md text-muted leading-relaxed">
              Grades, profiles, and billing logs stay private to your school, locked from outsiders,
              and backed up automatically every night.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
