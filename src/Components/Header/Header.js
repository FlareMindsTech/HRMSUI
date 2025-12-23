import React, { useState, useEffect } from 'react';

function Header({ isMobile }) {
  const username = "Vishnu AnandKannan";
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile search toggle
  const toggleSearch = () => {
    if (isMobile) {
      setSearchOpen(!searchOpen);
    }
  };

  return (
    <div style={{
      ...styles.header,
      ...(scrolled && styles.headerScrolled),
      width: '100%',
      display: 'flex',
      justifyContent: isMobile ? 'space-between' : 'flex-end',
      alignItems: 'center',
      gap: isMobile ? '10px' : '25px',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
    }}>

      {/* Mobile Page Title - Only on mobile */}
      {isMobile && (
        <div style={styles.mobileLeftSection}>
          <div style={styles.pageTitle}>HRMS</div>
        </div>
      )}


      {/* Right Section - Profile and Notifications */}
      <div style={{
        ...styles.rightSection,
        gap: isMobile ? '15px' : '25px',
        order: isMobile ? 2 : 'initial',
      }}>
       

        {/* Profile - Hide on very small mobile when search is open */}
        {(!isMobile || (isMobile && !searchOpen)) && (
          <div style={styles.profile}>
            {/* Avatar - Show only on desktop/tablet, hide on very small mobile */}
            {(!isMobile || window.innerWidth > 400) && (
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>{username.charAt(0)}</div>
                <div style={styles.statusIndicator} />
              </div>
            )}
            
            {/* Profile Info - Show on desktop/tablet */}
            {!isMobile && (
              <div style={styles.profileInfo}>
                <div style={styles.name}>
                  {username.length > 20 ? username.substring(0, 17) + '...' : username}
                </div>
                <div style={styles.role}>Admin</div>
              </div>
            )}
            
            {/* Dropdown - Always show if profile is visible */}
            {(!isMobile || window.innerWidth > 400) && (
              <span style={styles.dropdownIcon}>⌄</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  header: {
    height: "100%",
    padding: "0 20px",
    backgroundColor: "#1e1e2f",
    color: "white",
    borderBottom: "1px solid #2d2d40",
    transition: 'all 0.3s ease',
  },

  headerScrolled: {
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },

  mobileLeftSection: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 'fit-content',
  },

  pageTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e0e0f0',
    marginRight: '15px',
  },


  rightSection: {
    display: "flex",
    alignItems: "center",
    minWidth: 'fit-content',
  },

  iconButton: {
    position: "relative",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    fontSize: '18px',
    transition: "background-color 0.2s",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
    ':hover': {
      backgroundColor: "#2f2f45",
    },
  },

  avatarContainer: {
    position: "relative",
    marginRight: '8px',
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "14px",
    color: "white",
  },

  statusIndicator: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "8px",
    height: "8px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    border: "2px solid #1e1e2f",
  },

  profileInfo: {
    marginLeft: "8px",
    marginRight: "8px",
  },

  name: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e0e0f0",
    whiteSpace: 'nowrap',
  },

  role: {
    fontSize: "11px",
    color: "#a0a0c0",
    marginTop: "2px",
  },

  dropdownIcon: {
    fontSize: '18px',
    color: '#a0a0c0',
    marginLeft: '5px',
    display: 'flex',
    alignItems: 'center',
  },
};

// Add hover effects
Object.assign(styles.iconButton, {
  ':hover': {
    backgroundColor: "#2f2f45",
  },
});

export default Header;