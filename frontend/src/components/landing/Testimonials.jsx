import React from 'react';
import { Quote } from 'lucide-react';

const Testimonials = () => {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Trusted by Leading Nigerian Schools</h2>
          <p className="section-desc">Hear what educators and administrators have to say about our platform.</p>
        </div>
        <div className="test-grid">
          {[
            { c: "Eduvantage has completely transformed how we run Kings Academy.", name: "Mrs. Adeola Johnson", role: "Principal, Kings Academy", initials: "AJ", color: "blue" },
            { c: "The Parent Portal alone makes this software worth every kobo.", name: "Mr. Chukwudi Eze", role: "Director, Excellence Heights", initials: "CE", color: "purple" },
            { c: "The transition was smooth, and my teachers learned how to use the gradebook quickly.", name: "Dr. Fatima Bello", role: "Administrator, Scholars Pathway", initials: "FB", color: "orange" }
          ].map((t, i) => (
            <div className="test-card" key={i}>
              <div className="test-icon"><Quote size={20} /></div>
              <p className="test-content">"{t.c}"</p>
              <div className="test-author-box">
                <div className={`test-avatar ${t.color}`}>{t.initials}</div>
                <div>
                  <h4 className="test-name">{t.name}</h4>
                  <p className="test-role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
