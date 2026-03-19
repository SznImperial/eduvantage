import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const faqs = [
    { q: "How long does setup take?", a: "Most schools are fully set up within 48-72 hours." },
    { q: "Do parents need to pay to use the portal?", a: "No, the Parent Portal is included in all our plans at no extra cost." },
    { q: "How does the Paystack integration work?", a: "When parents pay fees through the portal, the money goes directly into your school's bank account settling next day." }
  ];

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div className={`faq-item ${openIndex === i ? 'open' : ''}`} key={i}>
              <button className="faq-question cursor-pointer" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                {f.q}
                <div className="faq-icon">{openIndex === i ? <Minus size={18} /> : <Plus size={18} />}</div>
              </button>
              <div className="faq-answer">
                <p className="faq-answer-inner">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
