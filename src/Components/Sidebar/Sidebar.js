import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard, MdBusiness, MdEventNote, MdAccessTime,
  MdPersonAdd, MdReceipt, MdAccountBalance, MdAssessment, MdLogout, MdWork
} from "react-icons/md";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: MdDashboard, section: "main" },
  { name: "Organisation", path: "/organisation", icon: MdBusiness, section: "main" },
  { name: "Leave Request", path: "/leave", icon: MdEventNote, section: "main" },
  { name: "Attendance", path: "/attendance", icon: MdAccessTime, section: "main" },
  { name: "Projects", path: "/projects", icon: MdWork, section: "main" },
  { name: "HR Onboarding", path: "/onboarding", icon: MdPersonAdd, section: "manage" },
  { name: "Payslip", path: "/payslip", icon: MdReceipt, section: "manage" },
  { name: "EPFO", path: "/epfo", icon: MdAccountBalance, section: "manage" },
  { name: "MIS", path: "/mis", icon: MdAssessment, section: "manage" },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const activePath = menuItems.find(
    item => location.pathname.startsWith(item.path)
  )?.path || "/dashboard";

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "/login";
  };

  const renderItem = (item) => {
    const isActive = activePath === item.path;
    const isHovered = hovered === item.path;
    const highlighted = isActive || isHovered;
    const Icon = item.icon;

    return (
      <li
        key={item.path}
        style={{
          ...styles.menuItem,
          background: isActive
            ? "rgba(45,197,138,0.15)"
            : isHovered
              ? "rgba(45,197,138,0.07)"
              : "transparent",
          boxShadow: isActive ? "inset 0 0 0 1px rgba(45,197,138,0.2)" : "none",
        }}
        onClick={() => navigate(item.path)}
        onMouseEnter={() => setHovered(item.path)}
        onMouseLeave={() => setHovered(null)}
      >
        <span style={{
          ...styles.iconWrap,
          background: isActive
            ? "rgba(45,197,138,0.22)"
            : isHovered
              ? "rgba(45,197,138,0.1)"
              : "rgba(255,255,255,0.04)",
        }}>
          <Icon style={{
            fontSize: 18,
            color: highlighted ? "#2DC58A" : "rgba(200,230,215,0.45)",
            transition: "color 0.2s",
          }} />
        </span>
        <span style={{
          ...styles.menuLabel,
          color: highlighted ? "#e8f8f2" : "rgba(180,220,200,0.6)",
          fontWeight: isActive ? 600 : 400,
        }}>
          {item.name}
        </span>
        {isActive && <span style={styles.activeIndicator} />}
      </li>
    );
  };

  return (
    <div style={styles.sidebar}>
      {/* ─── Brand ─── */}
      <div style={styles.brand}>
        <div style={styles.brandLogo}>
          <span style={{ color: "#2DC58A", fontWeight: 800, fontSize: 16 }}>T</span>
        </div>
        <div>
          <div style={styles.brandName}>TeamHub</div>
          <div style={styles.brandSub}>HR Management</div>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <div style={styles.navContainer}>
        <div style={styles.navSection}>
          <p style={styles.sectionLabel}>MAIN</p>
          <ul style={styles.menuList}>
            {menuItems.filter(i => i.section === "main").map(renderItem)}
          </ul>
        </div>

        <div style={styles.navSection}>
          <p style={styles.sectionLabel}>MANAGE</p>
          <ul style={styles.menuList}>
            {menuItems.filter(i => i.section === "manage").map(renderItem)}
          </ul>
        </div>
      </div>

      {/* ─── Promo Card ─── */}
      <div style={styles.promoCard}>
        <div style={styles.promoIcon}></div>
        <p style={styles.promoTitle}>Level Up Your HR System</p>
        <p style={styles.promoSub}>Upgrade to Pro for more features</p>
        <button style={styles.promoBtn}>Get TeamHub Pro</button>
      </div>

      {/* ─── User Profile / Logout ─── */}
      <div style={styles.userRow}>
        <div style={styles.userAvatar}>A</div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>Admin User</div>
          <div style={styles.userRole}>Administrator</div>
        </div>
        <button
          style={styles.logoutBtn}
          title="Logout"
          onClick={() => setShowModal(true)}
        >
          <MdLogout style={{ fontSize: 16, color: "#8ba49d" }} />
        </button>
      </div>

      {/* ─── Logout Modal ─── */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIconCircle}>
              <MdLogout style={{ fontSize: 24, color: "#ef4444" }} />
            </div>
            <h3 style={styles.modalTitle}>Confirm Logout</h3>
            <p style={styles.modalText}>Are you sure you want to log out of HRMS?</p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.confirmBtn} onClick={handleLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "100%", height: "100%",
    background: "transparent",
    borderRight: "none",
    display: "flex", flexDirection: "column",
    overflowY: "auto", overflowX: "hidden",
    scrollbarWidth: "none",
  },

  /* Brand */
  brand: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "20px 18px 14px",
    borderBottom: "1px solid rgba(45, 197, 138, 0.12)",
  },
  brandLogo: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, rgba(45,197,138,0.25) 0%, rgba(32,166,115,0.35) 100%)",
    border: "1px solid rgba(45, 197, 138, 0.4)",
    boxShadow: "0 0 14px rgba(45,197,138,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  brandName: { fontSize: 16, fontWeight: 700, color: "#e8f8f2", letterSpacing: "0.01em" },
  brandSub: { fontSize: 10, color: "rgba(45,197,138,0.65)", marginTop: 1 },

  /* Nav */
  navContainer: { flex: 1, padding: "10px 10px 0" },
  navSection: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
    color: "rgba(45,197,138,0.45)", margin: "12px 8px 4px",
    textTransform: "uppercase",
  },
  menuList: { listStyle: "none", padding: 0, margin: 0 },

  /* Menu Item */
  menuItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 10px", borderRadius: 9,
    cursor: "pointer", transition: "all 0.2s ease",
    position: "relative", marginBottom: 2,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 7,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "all 0.2s ease",
  },
  menuLabel: { fontSize: 13.5, transition: "color 0.2s", flex: 1 },
  activeIndicator: {
    width: 5, height: 5, borderRadius: "50%",
    background: "#2DC58A",
    boxShadow: "0 0 7px rgba(45,197,138,0.9)",
    flexShrink: 0,
  },

  /* Promo card */
  promoCard: {
    margin: "12px 12px 8px",
    background: "rgba(45, 197, 138, 0.1)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(45, 197, 138, 0.22)",
    borderRadius: 14, padding: "16px 14px",
    color: "#fff",
    boxShadow: "0 4px 24px rgba(45,197,138,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  promoIcon: { fontSize: 22, marginBottom: 6 },
  promoTitle: { fontSize: 13, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.3, color: "#e8f8f2" },
  promoSub: { fontSize: 10.5, margin: "0 0 10px", color: "rgba(200,240,220,0.72)" },
  promoBtn: {
    background: "linear-gradient(135deg,#2DC58A 0%,#20a673 100%)",
    color: "#fff",
    border: "none", borderRadius: 7,
    padding: "6px 14px", fontSize: 12, fontWeight: 700,
    cursor: "pointer", transition: "all 0.18s",
    width: "100%",
    boxShadow: "0 4px 14px rgba(45,197,138,0.32)",
  },

  /* User row */
  userRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px",
    borderTop: "1px solid rgba(45,197,138,0.12)",
    marginTop: "auto",
    background: "rgba(0,0,0,0.15)",
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(135deg,#2DC58A 0%,#1a9e6e 100%)",
    border: "1px solid rgba(45,197,138,0.45)",
    boxShadow: "0 0 10px rgba(45,197,138,0.22)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 12.5, fontWeight: 600, color: "#e8f8f2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userRole: { fontSize: 10.5, color: "rgba(45,197,138,0.6)" },
  logoutBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer", padding: 6, borderRadius: 7,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.18s",
  },

  /* Modal */
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,10,5,0.6)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    background: "rgba(12, 28, 20, 0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(45,197,138,0.18)",
    borderRadius: 18,
    padding: "28px 28px 24px", width: "90%", maxWidth: 360,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,197,138,0.07)",
    textAlign: "center",
  },
  modalIconCircle: {
    width: 52, height: 52, borderRadius: "50%",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.22)",
    margin: "0 auto 16px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: "#e8f8f2", margin: "0 0 6px" },
  modalText: { fontSize: 13.5, color: "rgba(200,230,215,0.7)", margin: "0 0 22px" },
  modalButtons: { display: "flex", gap: 10, justifyContent: "center" },
  cancelBtn: {
    flex: 1, padding: "9px 0",
    border: "1px solid rgba(45,197,138,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "#c8e6d8", borderRadius: 9, cursor: "pointer",
    fontSize: 13.5, fontWeight: 500,
  },
  confirmBtn: {
    flex: 1, padding: "9px 0",
    border: "none",
    background: "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)",
    color: "#fff", borderRadius: 9, cursor: "pointer",
    fontSize: 13.5, fontWeight: 600,
    boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
  },
};

export default Sidebar;
