import React, { useState } from 'react';
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
  MdPayments,
  MdAccountTree,
  MdSecurity,
  MdHistoryEdu,
  MdDns,
  MdAssignment,
  MdSettings,
} from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuthUser, selectIsSystemAdmin, useHasMenu, useHasPermission, logout } from '../../redux/slices/authSlice';
import './Sidebar.css';

// Menu codes frozen to backend seed registry. ROLE_MANAGEMENT is granted to
// Owner/Admin only (HR intentionally excluded); REIMBURSEMENT stands alone
// (never LEAVE_MGMT). ORGANISATION uses British S; everything else American Z.
const menuItems = [
  { name: 'Dashboard', path: '/dashboard', menuCode: 'DASHBOARD', icon: MdDashboard, section: 'main' },
  { name: 'Attendance', path: '/attendance', menuCode: 'ATTENDANCE', icon: MdAccessTime, section: 'main' },
  {
    name: 'Projects',
    path: '/projects',
    menuCode: 'PROJECTS',
    icon: MdWork,
    section: 'main',
    children: [
      { name: 'Tasks', path: '/projects/tasks', icon: MdAssignment },
    ],
  },
  {
    name: 'Organisation',
    path: '/organisation',
    menuCode: 'ORGANISATION',
    icon: MdBusiness,
    section: 'main',
    children: [
      { name: 'Branches', path: '/organisation/branches', icon: MdDomain, perm: 'branch.view' },
    ],
  },
  { name: 'Leave Request', path: '/leave', menuCode: 'LEAVE_MGMT', icon: MdEventNote, section: 'main' },
  { name: 'Reimbursements', path: '/reimbursement', menuCode: 'REIMBURSEMENT', icon: MdPayments, section: 'main' },
  { name: 'HR Onboarding', path: '/onboarding', menuCode: 'USER_MANAGEMENT', icon: MdPersonAdd, section: 'manage' },
  { name: 'Lifecycle & Separation', path: '/lifecycle', menuCode: 'USER_MANAGEMENT', icon: MdHistoryEdu, section: 'manage' },
  { name: 'Role Management', path: '/roles', menuCode: 'ROLE_MANAGEMENT', icon: MdAdminPanelSettings, section: 'manage' },
  { name: 'Approval Workflows', path: '/approval-workflows', menuCode: 'ROLE_MANAGEMENT', icon: MdAccountTree, section: 'manage' },
  { name: 'Assets', path: '/assets', menuCode: 'ASSETS', icon: MdDevices, section: 'manage' },
  { name: 'Audit Logs', path: '/audit-logs', menuCode: 'ROLE_MANAGEMENT', icon: MdSecurity, section: 'manage' },
  { name: 'Payslip', path: '/payslip', menuCode: 'PAYSLIP', icon: MdReceipt, section: 'manage' },
  { name: 'EPFO', path: '/epfo', menuCode: 'EPFO', icon: MdAccountBalance, section: 'manage' },
  { name: 'MIS', path: '/mis', menuCode: 'MIS', icon: MdAssessment, section: 'manage' },
  { name: 'Settings', path: '/settings', menuCode: 'ORGANISATION', icon: MdSettings, section: 'manage' },
  { name: 'Platform Admin', path: '/platform', menuCode: 'PLATFORM_DASHBOARD', icon: MdDns, section: 'manage', isPlatformOnly: true },
];

function Sidebar({ isExpanded = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasMenu = useHasMenu();
  const hasPermission = useHasPermission();
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});

  const toggleSubMenu = (path, e) => {
    if (e) e.stopPropagation();
    setOpenSubMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isVisible = (item) => {
    if (item.isPlatformOnly) {
      const roleCode = (user?.roleCode || user?.role?.roleCode || '').toUpperCase();
      return roleCode === 'SAAS_SUPER_ADMIN' || (user?.scope === 'PLATFORM' && !user?.organizationId);
    }
    if (item.menuCode === 'DASHBOARD') return true;
    if (isSystemAdmin) return true;
    return hasMenu(item.menuCode);
  };

  const visibleMainItems = menuItems.filter((i) => i.section === 'main' && isVisible(i));
  const visibleManageItems = menuItems.filter((i) => i.section === 'manage' && isVisible(i));

  const activePath = menuItems.find(
    (item) => location.pathname.startsWith(item.path)
  )?.path || '/dashboard';

  const handleLogout = () => {
    // Instant SPA logout: the logout thunk clears local session synchronously
    // and logout.pending clears Redux state the same tick, so the App route
    // gate redirects to /login. No window.location reload (full bundle
    // re-parse) and no scattered localStorage removes here — the thunk owns
    // the full key set. navigate() is a fallback for the transition tick.
    setShowModal(false);
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const renderItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && item.children.some((c) => location.pathname.startsWith(c.path));
    const isExactParentActive = location.pathname === item.path || (!isChildActive && location.pathname.startsWith(item.path));
    const isParentActive = activePath === item.path || location.pathname.startsWith(item.path);
    const isOpen = Boolean(openSubMenus[item.path]) || isChildActive;
    const Icon = item.icon;

    return (
      <div
        key={item.path}
        className={`sidebar-item-group${hasChildren ? ' has-children' : ''}${isOpen ? ' is-open' : ''}`}
      >
        <li
          className={`sidebar-menu-item${isExactParentActive ? ' active' : (isChildActive ? ' parent-active' : '')}${hasChildren ? ' has-children' : ''}`}
          onClick={() => {
            if (hasChildren) {
              setOpenSubMenus((prev) => ({ ...prev, [item.path]: !prev[item.path] }));
              navigate(item.path);
            } else {
              navigate(item.path);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (hasChildren) {
                setOpenSubMenus((prev) => ({ ...prev, [item.path]: !prev[item.path] }));
              }
              navigate(item.path);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={hasChildren ? isOpen : undefined}
          title={!isExpanded ? item.name : undefined}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubMenu(item.path, e);
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              aria-label={isOpen ? `Collapse ${item.name} submenu` : `Expand ${item.name} submenu`}
              title={isOpen ? 'Collapse' : 'Expand'}
            >
              <MdChevronRight className={`sidebar-chevron ${isOpen ? 'open' : ''}`} />
            </span>
          ) : (
            isParentActive && <MdChevronRight className="sidebar-chevron active-indicator" />
          )}
        </li>

        {/* ── Sub-menu Tree (shows on hover or when open/active) ── */}
        {hasChildren && (
          <div className={`sidebar-submenu-wrap${isOpen ? ' is-open' : ''}`}>
            <ul className="sidebar-submenu">
              {item.children.filter((sub) => !sub.perm || isSystemAdmin || hasPermission(sub.perm)).map((sub) => {
                const isSubActive =
                  location.pathname.startsWith(sub.path) ||
                  (sub.path === '/settings/organization' && (location.pathname === '/settings' || location.pathname === '/settings/'));
                const SubIcon = sub.icon;

                return (
                  <li
                    key={sub.path}
                    className={`sidebar-submenu-item${isSubActive ? ' active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(sub.path);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(sub.path);
                      }
                    }}
                    role="button"
                    tabIndex={0}
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
          {(user?.firstName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || user?.email?.split('@')[0] || 'User'}
          </div>
          <div className="sidebar-user-role">{user?.roleName || user?.roleCode || (user?.isOwner ? 'Owner' : 'Employee')}</div>
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
              <button type="button" className="sidebar-cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" className="sidebar-confirm-btn" onClick={handleLogout}>
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
