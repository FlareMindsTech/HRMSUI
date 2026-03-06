import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  MdDashboard,
  MdBusiness,
  MdPeople,
  MdEventNote,
  MdAccessTime,
  MdPersonAdd,
  MdReceipt,
  MdAccountBalance,
  MdAssessment,
  MdLogout
} from "react-icons/md";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <MdDashboard /> },
    { name: "Organisation", path: "/organisation", icon: <MdBusiness /> },

    { name: "Leave Request", path: "/leave", icon: <MdEventNote /> },
    { name: "Attendance Management", path: "/attendance", icon: <MdAccessTime /> },
    { name: "HR Onboarding", path: "/onboarding", icon: <MdPersonAdd /> },
    { name: "Payslip", path: "/payslip", icon: <MdReceipt /> },
    { name: "EPFO", path: "/epfo", icon: <MdAccountBalance /> },
    { name: "MIS", path: "/mis", icon: <MdAssessment /> },
    { name: "Logout", path: "#", icon: <MdLogout /> },
  ];

  const activeItem =
    menuItems.find(item => location.pathname.startsWith(item.path))?.name ||
    "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  return (
    <div style={styles.sidebar}>
      {/* Title */}
      <div style={styles.title}>
        <div style={styles.titleText}>HRMS</div>
        <div style={styles.titleSub}>Human Resource System</div>
      </div>

      {/* Menu */}
      <ul style={styles.menu}>
        {menuItems.map(item => {
          const isActive = activeItem === item.name && item.name !== "Logout";
          const isHovered = hoveredItem === item.name;
          const isSelected = isActive || isHovered;

          return (
            <li
              key={item.name}
              style={{
                ...styles.item,
                ...(isSelected ? styles.active : {})
              }}
              onClick={() => {
                if (item.name === "Logout") {
                  setShowLogoutModal(true);
                } else {
                  navigate(item.path);
                }
              }}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={styles.itemContent}>

                <span
                  style={{
                    ...styles.iconWrapper,
                    backgroundColor: isSelected ? "#ffffff" : "transparent"
                  }}
                >
                  <span
                    style={{
                      ...styles.icon,
                      color: isSelected ? "#032f2f" : "#9ca3af"
                    }}
                  >
                    {item.icon}
                  </span>
                </span>


                <span
                  style={{
                    ...styles.itemText,
                    color: isSelected ? "#ffffff" : "#9ca3af",
                    fontWeight: isActive ? "600" : "500"
                  }}
                >
                  {item.name}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Confirm Logout</h3>
            <p style={styles.modalText}>Are you sure you want to logout?</p>
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#032f2f",
    color: "#fff",
    display: "flex",
    flexDirection: "column"
  },

  title: {
    height: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#022626",
    borderBottom: "1px solid #2d2d40"
  },

  titleText: {
    fontSize: "20px",
    fontWeight: "bold"
  },

  titleSub: {
    fontSize: "11px",
    color: "#a0a0c0"
  },

  sidebarItemHover: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    color: '#ffffff',
  },

  menu: {
    listStyle: "none",
    padding: "16px 0",
    margin: 0,
    flex: 1
  },

  item: {
    padding: "10px 12px",
    margin: "4px 0",
    cursor: "pointer",
    transition: "all 0.25s ease",
    borderRadius: "14px"
  },

  itemContent: {
    display: "flex",
    alignItems: "center"
  },

  iconWrapper: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "14px",
    transition: "all 0.25s ease"
  },

  icon: {
    fontSize: "18px"
  },

  itemText: {
    fontSize: "14px"
  },

  active: {
    backgroundColor: "#054242",
    margin: "6px 12px"
  },

  /* Modal Styles */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    color: '#333'
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '10px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e1e2f'
  },
  modalText: {
    marginBottom: '24px',
    fontSize: '16px',
    color: '#4b5563'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelBtn: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  confirmBtn: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  }
};

export default Sidebar;
