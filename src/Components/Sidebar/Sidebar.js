import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdBusiness,
  MdDomain,
  MdEventNote,
  MdAccessTime,
  MdPersonAdd,
  MdReceipt,
  MdAccountBalance,
  MdAssessment,
  MdLogout,
  MdWork,
  MdAdminPanelSettings,
  MdDevices,
  MdChevronRight,
  MdCorporateFare,
} from 'react-icons/md';
import { logoutUser } from '../../services/attendanceService';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuthUser, selectIsSystemAdmin, selectHasMenu, logout } from '../../redux/slices/authSlice';
import './Sidebar.css';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', menuCode: 'DASHBOARD', icon: MdDashboard, section: 'main' },
  { name: 'Attendance', path: '/attendance', menuCode: 'ATTENDANCE', icon: MdAccessTime, section: 'main' },
  { name: 'Projects', path: '/projects', menuCode: 'PROJECTS', icon: MdWork, section: 'main' },
  {
    name: 'Organisation',
    path: '/organisation',
    menuCode: 'ORGANISATION',
    icon: MdBusiness,
    section: 'main',
    children: [
      { name: 'Branches', path: '/organisation/branches', icon: MdDomain },
    ],
  },
  { name: 'Leave Request', path: '/leave', menuCode: 'LEAVE_MGMT', icon: MdEventNote, section: 'main' },
  { name: 'HR Onboarding', path: '/onboarding', menuCode: 'USER_MANAGEMENT', icon: MdPersonAdd, section: 'manage' },
  { name: 'Role Management', path: '/roles', menuCode: 'ROLE_MANAGEMENT', icon: MdAdminPanelSettings, section: 'manage' },
  { name: 'Assets', path: '/assets', menuCode: 'ASSETS', icon: MdDevices, section: 'manage' },
  { name: 'Payslip', path: '/payslip', menuCode: 'PAYSLIP', icon: MdReceipt, section: 'manage' },
  { name: 'EPFO', path: '/epfo', menuCode: 'EPFO', icon: MdAccountBalance, section: 'manage' },
  { name: 'MIS', path: '/mis', menuCode: 'MIS', icon: MdAssessment, section: 'manage' },
];

function Sidebar({ isExpanded = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasMenu = useSelector((state) => (menuCode) => selectHasMenu(state, menuCode));
  const dispatch = useDispatch();
  const [hovered, setHovered] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});

  const toggleSubMenu = (path, e) => {
    if (e) e.stopPropagation();
    setOpenSubMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isVisible = (item) => {
    if (item.menuCode === 'DASHBOARD') return true;
    if (isSystemAdmin) return true;
    return hasMenu(item.menuCode);
  };

  const visibleMainItems = menuItems.filter((i) => i.section === 'main' && isVisible(i));
  const visibleManageItems = menuItems.filter((i) => i.section === 'manage' && isVisible(i));

  const activePath = menuItems.find(
    (item) => location.pathname.startsWith(item.path)
  )?.path || '/dashboard';

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout request notice:', e);
    } finally {
      await dispatch(logout());
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('organizationId');
      window.location.href = '/login';
    }
  };

  const renderItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isBranchChildActive = hasChildren && item.children.some((c) => location.pathname.startsWith(c.path));
    const isExactParentActive = location.pathname === item.path || (item.path === '/organisation' && !isBranchChildActive && location.pathname.startsWith('/organisation'));
    const isParentActive = activePath === item.path || location.pathname.startsWith(item.path);
    const isHovered = hovered === item.path;
    const isOpen = Boolean(openSubMenus[item.path]) || isBranchChildActive;
    const Icon = item.icon;

    return (
      <div
        key={item.path}
        className={`sidebar-item-group${hasChildren ? ' has-children' : ''}${isOpen ? ' is-open' : ''}`}
      >
        <li
          className={`sidebar-menu-item${isExactParentActive ? ' active' : (isBranchChildActive ? ' parent-active' : '')}${isHovered ? ' is-hovered' : ''}${hasChildren ? ' has-children' : ''}`}
          onClick={() => {
            if (hasChildren) {
              setOpenSubMenus((prev) => ({ ...prev, [item.path]: !prev[item.path] }));
              navigate(item.path);
            } else {
              navigate(item.path);
            }
          }}
          onMouseEnter={() => setHovered(item.path)}
          onMouseLeave={() => setHovered(null)}
          role="button"
          tabIndex={0}
          title={item.name}
        >
          <span className="sidebar-icon-wrap">
            <Icon className="sidebar-icon" />
          </span>
          <span className="sidebar-label">{item.name}</span>
          {hasChildren ? (
            <span
              className={`sidebar-chevron-btn ${isOpen ? 'open' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleSubMenu(item.path, e);
              }}
              title={isOpen ? 'Collapse' : 'Expand'}
            >
              <MdChevronRight className={`sidebar-chevron ${isOpen ? 'open' : ''}`} />
            </span>
          ) : (
            isParentActive && <MdChevronRight className="sidebar-chevron active-indicator" />
          )}
        </li>

        {/* ── Sub-menu Tree (shows ONLY when clicked & sidebar is expanded) ── */}
        {hasChildren && isOpen && isExpanded && (
          <div className="sidebar-submenu-wrap">
            <ul className="sidebar-submenu">
              {item.children.map((sub) => {
                const isSubActive = location.pathname.startsWith(sub.path);
                const SubIcon = sub.icon;

                return (
                  <li
                    key={sub.path}
                    className={`sidebar-submenu-item${isSubActive ? ' active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(sub.path);
                    }}
                    role="button"
                    title={sub.name}
                  >
                    <span className="sidebar-submenu-icon-wrap">
                      <SubIcon className="sidebar-submenu-icon" />
                    </span>
                    <span className="sidebar-submenu-label">{sub.name}</span>
                    {isSubActive && <span className="sidebar-submenu-dot" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sidebar${isExpanded ? ' is-expanded' : ''}`}>
      {/* ── Brand Header ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">T</span>
        </div>
        <div className="sidebar-brand-info">
          <div className="sidebar-brand-name">TeamHub</div>
          <div className="sidebar-brand-sub">Enterprise HRMS</div>
        </div>
      </div>

      {/* ── Navigation List ── */}
      <div className="sidebar-nav-container">
        {visibleMainItems.length > 0 && (
          <div className="sidebar-nav-section">
            <p className="sidebar-section-label">WORKSPACE</p>
            <ul className="sidebar-menu">{visibleMainItems.map(renderItem)}</ul>
          </div>
        )}

        {visibleManageItems.length > 0 && (
          <div className="sidebar-nav-section">
            <p className="sidebar-section-label">MANAGEMENT</p>
            <ul className="sidebar-menu">{visibleManageItems.map(renderItem)}</ul>
          </div>
        )}
      </div>

      {/* ── User Footer & Logout ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">
          {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Team Member'}
          </div>
          <div className="sidebar-user-role">{user?.roleName || 'Employee'}</div>
        </div>
        <button
          className="sidebar-logout-button"
          title="Sign Out"
          onClick={() => setShowModal(true)}
          aria-label="Sign Out"
        >
          <MdLogout className="sidebar-logout-icon" />
        </button>
      </div>

      {/* ── Logout Confirmation Dialog ── */}
      {showModal && (
        <div className="sidebar-modal">
          <div className="sidebar-modal-content">
            <div className="sidebar-modal-icon-circle">
              <MdLogout className="sidebar-modal-danger-icon" />
            </div>
            <h3 className="sidebar-modal-title">Confirm Sign Out</h3>
            <p className="sidebar-modal-text">
              Are you sure you want to end your current session and sign out?
            </p>
            <div className="sidebar-modal-buttons">
              <button className="sidebar-cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="sidebar-confirm-btn" onClick={handleLogout}>
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
