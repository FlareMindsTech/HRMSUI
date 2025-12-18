import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const [active, setActive] = useState('Dashboard');

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Organisation", path: "/organisation" },
    { name: "User Management", path: "/users" },
    { name: "Leave Request", path: "/leave" },
    { name: "Attendance Management", path: "/attendance" },
    { name: "HR Onboarding", path: "/onboarding" },
    { name: "Payslip", path: "/payslip" },
    { name: "EPFO", path: "/epfo" },
    { name: "MIS", path: "/mis" }
  ];

  return (
    <div style={styles.sidebar}>

      {/* HRMS Title */}
      <div style={styles.title}>HRMS</div>

      {/* Menu */}
      <ul style={styles.menu}>
        {menuItems.map(item => (
          <li
            key={item.name}
            style={{
              ...styles.item,
              ...(active === item.name ? styles.active : {})
            }}
            onClick={() => {
              setActive(item.name);
              navigate(item.path);
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#2f2f45"}
            onMouseLeave={(e) => {
              if (active !== item.name) e.target.style.backgroundColor = "transparent";
            }}
          >
            {item.name}
          </li>
        ))}
      </ul>

    </div>
  );
}

const styles = {

  sidebar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e1e2f',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column'
  },

  title: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    backgroundColor: '#141421',
    letterSpacing: '1px'
  },

  menu: {
    listStyle: 'none',
    padding: '10px 0',
    margin: 0
  },

  item: {
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: '0.3s',
  },

  active: {
    backgroundColor: '#4f46e5',
    fontWeight: 'bold'
  }

};

export default Sidebar;
