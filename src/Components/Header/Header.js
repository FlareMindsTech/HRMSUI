import React from 'react';

function Header() {
  const username = "Vishnu AnandKannan"; // Change later dynamically

  return (
    <div style={styles.header}>

      {/* Right Side Profile */}
      <div style={styles.profile}>
        <div style={styles.avatar}>{username.charAt(0)}</div>
        <span style={styles.name}>{username}</span>
      </div>

    </div>
  );
}

const styles = {

  header: {
    height: "100%",
    display: "flex",
    justifyContent: "flex-end",   // Move to right
    alignItems: "center",
    paddingRight: "20px",
    backgroundColor: "#0B6FA8",
    color: "white"
  },

  profile: {
    display: "flex",
    flexDirection: "column",      // Name below icon
    alignItems: "center",
    fontSize: "12px",
    gap: "4px"
  },

  avatar: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    backgroundColor: "#1C245E",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "14px"
  },

  name: {
    fontSize: "12px",
    color: "white"
  }

};

export default Header;
