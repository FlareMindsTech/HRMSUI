import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch,
  MdNotifications,
  MdKeyboardArrowDown,
  MdLogout,
  MdAccessTime,
  MdWork,
  MdAdminPanelSettings,
  MdCheckCircle,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/attendanceService';
import './Header.css';

function Header({ isMobile }) {
  const { user, isSystemAdmin, logoutUserLocal } = useAuth();
  const navigate = useNavigate();

  const [searchVal, setSearchVal] = useState('');
  const [searchFocus, setFocus] = useState(false);
  const [notifCount] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'System Owner';
  const roleName = user?.roleName || (user?.priority === 1 ? 'Owner' : 'Administrator');
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'O';
  const userEmail = user?.email || user?.workEmail || 'user@hrms.internal';

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout request notice:', e);
    } finally {
      logoutUserLocal();
      window.location.href = '/login';
    }
  };

  return (
    <header className="header-container">
      {/* ── Left: Search Bar or Mobile Brand ── */}
      {isMobile ? (
        <div className="header-mobile-brand">
          <span className="header-mobile-brand-icon">T</span>
          <span className="header-mobile-brand-text">TeamHub</span>
        </div>
      ) : (
        <div className={`header-search-wrap ${searchFocus ? 'header-search-wrap--focused' : ''}`}>
          <MdSearch className="header-search-icon" />
          <input
            className="header-search-input"
            placeholder="Search employees, projects, modules..."
            value={searchVal}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onChange={e => setSearchVal(e.target.value)}
          />
          <span className="header-search-kbd">/</span>
        </div>
      )}

      {/* ── Right: Notifications & Profile ── */}
      <div className="header-right-actions">
        {/* Notification Bell */}
        <div className="header-menu-anchor" ref={notifMenuRef}>
          <button
            className="header-icon-btn"
            onClick={() => {
              setShowNotifMenu(p => !p);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
            title="Notifications"
          >
            <span className="header-icon-badge-anchor">
              <MdNotifications className="header-notif-bell-icon" />
              {notifCount > 0 && <span className="header-notif-badge">{notifCount}</span>}
            </span>
          </button>

          {showNotifMenu && (
            <div className="header-dropdown-panel">
              <div className="header-dropdown-header">
                <span className="header-dropdown-title">Notifications</span>
                <span className="header-dropdown-tag">3 New</span>
              </div>
              <div className="header-notif-list">
                <div className="header-notif-item">
                  <div className="header-notif-icon-circle header-notif-icon-circle--mint">
                    <MdCheckCircle size={14} />
                  </div>
                  <div>
                    <div className="header-notif-title">Daily Attendance System</div>
                    <div className="header-notif-time">Remember to punch in for your scheduled shift</div>
                  </div>
                </div>
                <div className="header-notif-item">
                  <div className="header-notif-icon-circle header-notif-icon-circle--sky">
                    <MdWork size={14} />
                  </div>
                  <div>
                    <div className="header-notif-title">Project Tasks Ready</div>
                    <div className="header-notif-time">Check the Project Management tab for active sprints</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="header-vertical-sep" />

        {/* Profile Chip & Dropdown */}
        <div className="header-menu-anchor" ref={profileMenuRef}>
          <div
            className={`header-profile-chip ${showProfileMenu ? 'header-profile-chip--active' : ''}`}
            onClick={() => {
              setShowProfileMenu(p => !p);
              setShowNotifMenu(false);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="header-avatar">{initials}</div>
            {!isMobile && (
              <div className="header-profile-info">
                <span className="header-profile-name">{fullName}</span>
                <span className="header-profile-role">{roleName}</span>
              </div>
            )}
            <MdKeyboardArrowDown
              className={`header-profile-chevron ${showProfileMenu ? 'header-profile-chevron--open' : ''}`}
            />
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="header-dropdown-panel header-dropdown-panel--profile">
              <div className="header-user-dropdown-card">
                <div className="header-large-avatar">{initials}</div>
                <div className="header-user-details">
                  <div className="header-dropdown-user-name">{fullName}</div>
                  <div className="header-dropdown-user-role">{roleName}</div>
                  <div className="header-dropdown-user-email">{userEmail}</div>
                </div>
              </div>

              <div className="header-dropdown-divider" />

              <div className="header-dropdown-section">
                <div
                  className="header-dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/attendance');
                  }}
                >
                  <MdAccessTime size={16} color="#2DC58A" />
                  <span>My Attendance</span>
                </div>
                <div
                  className="header-dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/projects');
                  }}
                >
                  <MdWork size={16} color="#0ea5e9" />
                  <span>My Projects & Tasks</span>
                </div>
                {isSystemAdmin && (
                  <div
                    className="header-dropdown-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/roles');
                    }}
                  >
                    <MdAdminPanelSettings size={16} color="#8b5cf6" />
                    <span>Role & Access Control</span>
                  </div>
                )}
              </div>

              <div className="header-dropdown-divider" />

              <div
                className="header-dropdown-item header-dropdown-item--danger"
                onClick={handleLogout}
              >
                <MdLogout size={16} color="#ef4444" />
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;