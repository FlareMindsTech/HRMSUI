import React from 'react';

function Footer() {
  return (
    <div style={{
      fontSize: 11.5,
      color: "#8ba49d",
      display: "flex",
      alignItems: "center",
      gap: 6,
      letterSpacing: "0.01em",
    }}>
      <span style={{ color: "#2DC58A", fontWeight: 700 }}>TeamHub</span>
      <span style={{ color: "#d5e6de" }}>·</span>
      <span>© {new Date().getFullYear()} FlareMindsTech. All rights reserved.</span>
    </div>
  );
}

export default Footer;