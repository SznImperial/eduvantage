import React from 'react';
import { Globe, Users, MonitorSmartphone, CreditCard, CalendarCheck, BookOpen } from 'lucide-react';

const Features = () => {
  const features = [
    { name: 'School Website Builder', description: 'Create a professional online presence for your school with zero coding required.', icon: Globe },
    { name: 'Student Management System', description: 'Maintain comprehensive student records neatly organized and readily accessible.', icon: Users },
    { name: 'Parent Portal', description: 'Keep parents engaged with real-time access to progress, attendance, and announcements.', icon: MonitorSmartphone },
    { name: 'Paystack Integration', description: 'Accept school fees online effortlessly and securely through Paystack.', icon: CreditCard },
    { name: 'Attendance Tracking', description: 'Streamline daily roll calls with digital attendance tracking and automated notifications.', icon: CalendarCheck },
    { name: 'Gradebook & Report Cards', description: 'Automatically calculate grades and generate standard Nigerian report cards.', icon: BookOpen },
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything you need to run your school</h2>
          <p className="section-desc">Say goodbye to paperwork and isolated systems. Eduvantage provides a unified solution to manage every aspect of your institution.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon"><feature.icon size={24} /></div>
              <h3 className="feature-title">{feature.name}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
