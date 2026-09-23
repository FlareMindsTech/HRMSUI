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
import { FaBuilding, FaCodeBranch, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { logoutUser } from '../../services/attendanceService';
import './Header.css';

function Header({ isMobile }) {
  const { user, isSystemAdmin, logoutUserLocal } = useAuth();
  const {
    organization,
    branches,
    accessLevel,
    selectedBranchId,
    setSelectedBranchId,
    selectedBranchObj,
  } = useBranch();
  const navigate = useNavigate();

  const [searchVal, setSearchVal] = useState('');
  const [searchFocus, setFocus] = useState(false);
  const [notifCount] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const branchMenuRef = useRef(null);

  const orgDisplayName = organization?.organizationName || organization?.displayName || organization?.legalName || "Organization";

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
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target)) {
        setShowBranchMenu(false);
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

      {/* ── Right: Organization, Branch Switcher, Notifications & Profile ── */}
      <div className="header-right-actions">
        {/* Organization Indicator */}
        {organization && (
          <div
            className="header-org-chip"
            onClick={() => (isSystemAdmin || user?.roleCode === 'OWNER') && navigate('/organisation')}
            title={`Organization: ${orgDisplayName}`}
            role="button"
            tabIndex={0}
          >
            <div className="header-org-icon-wrap">
              <FaBuilding size={12} />
            </div>
            {!isMobile && (
              <div className="header-org-info">
                <span className="header-org-name">{orgDisplayName}</span>
                {organization.organizationCode && (
                  <span className="header-org-code">{organization.organizationCode}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Branch Selector Dropdown */}
        {branches.length > 0 && (
          <div className="header-menu-anchor" ref={branchMenuRef}>
            {branches.length === 1 ? (
              <div className="header-single-branch-chip" title={`Branch: ${branches[0].branchName}`}>
                <FaCodeBranch className="text-success" size={12} />
                <span className="header-branch-name text-truncate">
                  {branches[0].branchName}
                </span>
              </div>
            ) : (
              <div
                className={`header-branch-chip ${showBranchMenu ? 'header-branch-chip--active' : ''}`}
                onClick={() => {
                  setShowBranchMenu((p) => !p);
                  setShowProfileMenu(false);
                  setShowNotifMenu(false);
                }}
                role="button"
                tabIndex={0}
                title="Switch Active Branch Filter"
              >
                <div className="header-branch-icon-wrap">
                  <FaCodeBranch size={12} />
                </div>
                <div className="header-branch-info">
                  <span className="header-branch-label">BRANCH</span>
                  <span className="header-branch-name text-truncate">
                    {selectedBranchObj ? selectedBranchObj.branchName : 'All Branches'}
                  </span>
                </div>
                <MdKeyboardArrowDown
                  className={`header-branch-chevron ${showBranchMenu ? 'header-branch-chevron--open' : ''}`}
                />
              </div>
            )}

            {/* Branch Selector Dropdown Panel */}
            {showBranchMenu && branches.length > 1 && (
              <div className="header-dropdown-panel header-dropdown-panel--branch">
                <div className="header-dropdown-header">
                  <span className="header-dropdown-title">Branch Access & Filter</span>
                  <span className="header-dropdown-tag">{branches.length} Available</span>
                </div>

                <div className="header-branch-list">
                  {/* Option: All Accessible Branches (available for org-wide or multi-branch users) */}
                  {(accessLevel === 'ORGANIZATION' || branches.length > 1) && (
                    <div
                      className={`header-branch-item ${!selectedBranchId ? 'header-branch-item--active' : ''}`}
                      onClick={() => {
                        setSelectedBranchId('');
                        setShowBranchMenu(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div className="header-branch-item-icon">
                          <FaBuilding size={12} />
                        </div>
                        <div>
                          <div className="header-branch-item-name">All Accessible Branches</div>
                          <div className="header-branch-item-sub">View aggregated data across branches</div>
                        </div>
                      </div>
                      {!selectedBranchId && <FaCheck size={11} className="text-success ms-auto" />}
                    </div>
                  )}

                  <div className="header-dropdown-divider" />

                  {/* Individual Authorized Branches */}
                  {branches.map((b) => {
                    const bId = String(b._id || b.id);
                    const isSelected = String(selectedBranchId) === bId;

                    return (
                      <div
                        key={bId}
                        className={`header-branch-item ${isSelected ? 'header-branch-item--active' : ''}`}
                        onClick={() => {
                          setSelectedBranchId(bId);
                          setShowBranchMenu(false);
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          <div className={`header-branch-item-icon ${isSelected ? 'icon-active' : ''}`}>
                            <FaCodeBranch size={12} />
                          </div>
                          <div className="min-w-0">
                            <div className="header-branch-item-name text-truncate">{b.branchName}</div>
                            <div className="header-branch-item-sub text-truncate">
                              <code>{b.branchCode}</code> {b.city ? `• ${b.city}` : ''}
                            </div>
                          </div>
                        </div>
                        {isSelected && <FaCheck size={11} className="text-success ms-auto flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div className="header-vertical-sep" />

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