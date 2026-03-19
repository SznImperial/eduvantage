import React, { useState } from 'react';
import { Menu, X, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <BookOpen style={{ marginRight: '8px' }} />
          <span>Eduvantage</span>
        </Link>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-actions">
          <button className="nav-login cursor-pointer">Log in</button>
          <button className="btn btn-primary cursor-pointer">Sign up</button>
        </div>
        <button className="mobile-menu-btn cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
      {isOpen && (
        <div className="mobile-menu">
          <a onClick={() => setIsOpen(false)} href="#features">Features</a>
          <a onClick={() => setIsOpen(false)} href="#pricing">Pricing</a>
          <a onClick={() => setIsOpen(false)} href="#testimonials">Testimonials</a>
          <a onClick={() => setIsOpen(false)} href="#faq">FAQ</a>
          <button className="btn nav-login" style={{ background: '#f3f4f6' }}>Log in</button>
          <button className="btn btn-primary">Sign up</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
