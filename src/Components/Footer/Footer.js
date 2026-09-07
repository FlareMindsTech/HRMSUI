import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <div className="app-footer">
      <span className="app-footer-brand">TeamHub</span>
      <span className="app-footer-dot">·</span>
      <span className="app-footer-copy">© {new Date().getFullYear()} FlareMindsTech. All rights reserved.</span>
    </div>
  );
}

export default Footer;