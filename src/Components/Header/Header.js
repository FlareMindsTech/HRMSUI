import React, { useState } from 'react';
import { MdSearch, MdNotifications, MdSettings, MdKeyboardArrowDown } from 'react-icons/md';

const username = "Davis Levin";
const initials = username.split(" ").map(n => n[0]).join("").toUpperCase();

function Header({ isMobile }) {
  const [searchVal, setSearchVal] = useState("");
  const [searchFocus, setFocus] = useState(false);
  const [notifCount] = useState(3);

  return (
    <div style={{
      ...styles.header,
      padding: isMobile ? "0 14px 0 56px" : "0 24px",
      justifyContent: "space-between",
    }}>

      {/* ── Left: Page title (mobile) or Search ── */}
      {isMobile ? (
        <span style={styles.mobileBrand}>HRMS</span>
      ) : (
        <div style={{
          ...styles.searchWrap,
          ...(searchFocus ? styles.searchFocused : {}),
        }}>
          <MdSearch style={{ fontSize: 16, color: "#8ba49d", flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Search anything…"
            value={searchVal}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onChange={e => setSearchVal(e.target.value)}
          />
        </div>
      )}

      {/* ── Right Actions ── */}
      <div style={styles.right}>

        {/* Notification bell */}
        <button style={styles.iconBtn} aria-label="Notifications">
          <span style={{ position: "relative", display: "inline-flex" }}>
            <MdNotifications style={{ fontSize: 20, color: "#6b7e77" }} />
            {notifCount > 0 && (
              <span style={styles.badge}>{notifCount}</span>
            )}
          </span>
        </button>

        {/* Settings */}
        {!isMobile && (
          <button style={styles.iconBtn} aria-label="Settings">
            <MdSettings style={{ fontSize: 19, color: "#6b7e77" }} />
          </button>
        )}

        {/* Vertical separator */}
        <div style={styles.sep} />

        {/* Profile chip */}
        <div style={styles.profileChip}>
          <div style={styles.avatar}>{initials}</div>
          {!isMobile && (
            <div style={styles.profileText}>
              <span style={styles.profileName}>{username}</span>
              <span style={styles.profileRole}>Admin</span>
            </div>
          )}
          <MdKeyboardArrowDown style={{ fontSize: 15, color: "#8ba49d", marginLeft: 2 }} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    borderBottom: "1px solid #e8f0ec",
    gap: 8,
  },

  mobileBrand: {
    fontSize: 15, fontWeight: 700, color: "#1a2e2a",
  },

  /* Search */
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f4f8f6",
    border: "1px solid #e0ede7",
    borderRadius: 10,
    padding: "7px 14px",
    width: 240,
    transition: "all 0.2s ease",
  },
  searchFocused: {
    width: 320,
    background: "#fff",
    border: "1px solid #2DC58A",
    boxShadow: "0 0 0 3px rgba(45,197,138,0.12)",
  },
  searchInput: {
    background: "transparent", border: "none", outline: "none",
    color: "#1a2e2a", fontSize: 13.5, flex: 1,
    caretColor: "#2DC58A",
  },

  /* Right */
  right: {
    display: "flex", alignItems: "center", gap: 4,
  },

  iconBtn: {
    background: "transparent", border: "none", cursor: "pointer",
    width: 36, height: 36, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s ease",
    outline: "none",
  },

  badge: {
    position: "absolute", top: -4, right: -4,
    width: 14, height: 14, borderRadius: "50%",
    background: "#ef4444", color: "#fff",
    fontSize: 8.5, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1.5px solid #fff",
  },

  sep: {
    width: 1, height: 26,
    background: "#e0ede7",
    margin: "0 8px",
  },

  /* Profile chip */
  profileChip: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f4f8f6",
    border: "1px solid #e0ede7",
    borderRadius: 10,
    padding: "5px 10px 5px 6px",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  avatar: {
    width: 30, height: 30, borderRadius: 7,
    background: "linear-gradient(135deg,#2DC58A 0%,#20a673 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
    boxShadow: "0 2px 6px rgba(45,197,138,0.3)",
  },
  profileText: { display: "flex", flexDirection: "column" },
  profileName: { fontSize: 13, fontWeight: 600, color: "#1a2e2a", lineHeight: 1.2, whiteSpace: "nowrap" },
  profileRole: { fontSize: 10, color: "#8ba49d", marginTop: 1 },
};

export default Header;