import React from 'react';
import { BookOpen, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <div className="footer-logo-icon"><BookOpen size={20} fill="white" /></div>
              <span>Eduvantage</span>
            </div>
            <p className="footer-desc">Complete School Management Software designed to empower modern Nigerian education.</p>
            <div className="footer-social">
              <a href="#"><Twitter size={18} /></a>
              <a href="#"><Facebook size={18} /></a>
              <a href="#"><Instagram size={18} /></a>
              <a href="#"><Linkedin size={18} /></a>
            </div>
          </div>
          <div>
            <h4 className="footer-title">Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Parent Portal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Contact Us</h4>
            <ul className="footer-contact">
              <li><span>Email:</span> hello@eduvantage.com.ng</li>
              <li><span>Phone:</span> +234 800 EDU VANT</li>
              <li><span>Address:</span> 12 Education Way, Yaba, Lagos.</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Eduvantage Limited. All rights reserved.</p>
          <div className="footer-legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
