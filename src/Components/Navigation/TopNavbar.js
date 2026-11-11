import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MdNotificationsNone,
  MdMenu,
  MdClose,
} from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import { LuPanelLeft } from 'react-icons/lu';
import { selectAuthUser, selectIsSystemAdmin, logout } from '../../redux/slices/authSlice';
import './TopNavbar.css';

/* ── Navigation Schema ── */
const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Dashboard',
    path: '/dashboard',
    exact: true,
  },
  {
    key: 'people',
    label: 'People',
    path: '/organisation/branches',
  },
  {
    key: 'time',
    label: 'Attendance',
    path: '/attendance',
  },
  {
    key: 'project',
    label: 'Project',
    path: '/projects',
  },
  {
    key: 'finance',
    label: 'Finance',
    path: '/payslip',
  },
  {
    key: 'control',
    label: 'Control',
    path: '/approval-workflows',
  },
];

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sign-out modal state
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const confirmBtnRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile top drawer if sidebar is toggled
  useEffect(() => {
    const handleClose = () => setIsMobileMenuOpen(false);
    window.addEventListener('teamhub:toggle-sidebar', handleClose);
    return () => window.removeEventListener('teamhub:toggle-sidebar', handleClose);
  }, []);

  const isNavItemActive = (item) => {
    const p = location.pathname;
    if (item.key === 'home') {
      return p === '/dashboard' || p === '/';
    }
    if (item.key === 'people') {
      return (
        p.startsWith('/organisation') ||
        p.startsWith('/branches') ||
        p.startsWith('/onboarding') ||
        p.startsWith('/roles')
      );
    }
    if (item.key === 'time') {
      return (
        p.startsWith('/attendance') ||
        p.startsWith('/leave')
      );
    }
    if (item.key === 'project') {
      return (
        p.startsWith('/projects') ||
        p.startsWith('/tasks')
      );
    }
    if (item.key === 'finance') {
      return (
        p.startsWith('/payslip') ||
        p.startsWith('/epfo') ||
        p.startsWith('/mis') ||
        p.startsWith('/reimbursement')
      );
    }
    if (item.key === 'control') {
      return (
        p.startsWith('/approval-workflows') ||
        p.startsWith('/audit-logs') ||
        p.startsWith('/assets') ||
        p.startsWith('/users') ||
        p.startsWith('/lifecycle') ||
        p.startsWith('/platform') ||
        p.startsWith('/settings') ||
        p.startsWith('/subscription-renewal')
      );
    }
    return false;
  };

  const handleConfirmLogout = () => {
    setShowSignoutModal(false);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const displayName =
    user?.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'FM Sagadhevan';
  const displayRole = user?.roleName || user?.roleCode || user?.role || 'Owner';
  const initials = (displayName.charAt(0) || 'U').toUpperCase();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <>
      <header className="th-top-navbar" role="banner">
        {/* ── Brand & Sidebar Toggle ── */}
        <div className="th-topnav-brand-section">
          {!isDashboard && (
            <button
              type="button"
              className="th-topnav-sidebar-toggle-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('teamhub:toggle-sidebar'));
              }}
              title="Toggle Sidebar Navigation"
              aria-label="Toggle Sidebar Navigation"
            >
              <LuPanelLeft size={19} />
            </button>
          )}
          <Link to="/dashboard" className="th-topnav-brand-link" title="TeamHub HRMS">
            <div className="th-topnav-brand-badge">T</div>
            <span className="th-topnav-brand-title">TeamHub</span>
          </Link>
        </div>

        {/* ── Center Nav ── */}
        <nav className="th-topnav-links" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item);
            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.exact}
                className={`th-topnav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('teamhub:nav-section', { detail: { section: item.key } })
                  );
                }}
              >
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="th-topnav-actions">
          {/* Notifications */}
          <button
            type="button"
            className="th-topnav-btn th-icon-only-btn"
            title="Notifications"
            aria-label="Notifications"
          >
            <MdNotificationsNone size={18} />
            <span className="th-topnav-notif-dot" />
          </button>

          {/* User Profile displaying Name */}
          <div
            className="th-topnav-user-profile"
            title={`${displayName} (${displayRole}) — Click to sign out`}
            role="button"
            tabIndex={0}
            onClick={() => setShowSignoutModal(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowSignoutModal(true);
              }
            }}
          >
            <div className="th-topnav-avatar">
              {initials}
              <span className="th-topnav-avatar-status" />
            </div>
            <div className="th-topnav-user-details d-none d-lg-flex">
              <span className="th-topnav-user-name">{displayName}</span>
              <span className="th-topnav-user-role">{displayRole}</span>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="th-topnav-btn th-mobile-menu-trigger d-lg-none"
            onClick={() => {
              setIsMobileMenuOpen((prev) => {
                const next = !prev;
                if (next) {
                  window.dispatchEvent(new CustomEvent('teamhub:close-sidebar'));
                }
                return next;
              });
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <MdClose size={18} /> : <MdMenu size={18} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Responsive Drawer ── */}
      {isMobileMenuOpen && (
        <div className="th-mobile-nav-drawer" role="dialog" aria-modal="true">
          <div className="th-mobile-drawer-header">
            <span className="fw-bold">Navigation</span>
            <button
              type="button"
              className="th-topnav-exit-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <MdClose size={18} />
            </button>
          </div>
          <div className="th-mobile-drawer-body">
            {NAV_ITEMS.map((item) => (
              <div key={item.key}>
                <NavLink
                  to={item.path}
                  className="th-mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
                {item.dropdown?.map((group) =>
                  group.links
                    .filter((link) => !link.platformOnly || isSystemAdmin)
                    .map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className="th-mobile-nav-sublink"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                        {link.badge && (
                          <span className={`th-nav-pill-badge ms-auto ${link.badgeBrand ? 'is-brand' : ''}`}>
                            {link.badge}
                          </span>
                        )}
                      </NavLink>
                    ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sign-Out Confirmation Dialog ── */}
      {showSignoutModal && (
        <div
          className="th-modal-backdrop"
          onClick={() => setShowSignoutModal(false)}
          role="presentation"
        >
          <div
            className="th-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="th-signout-title"
            aria-describedby="th-signout-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="th-modal-header">
              <h2 id="th-signout-title" className="th-modal-title">Sign Out</h2>
            </div>
            <div id="th-signout-desc" className="th-modal-body">
              Are you sure you want to end your current session? Any unsaved form drafts will be discarded.
            </div>
            <div className="th-modal-footer">
              <button
                type="button"
                className="th-btn-secondary"
                onClick={() => setShowSignoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="th-btn-danger"
                ref={confirmBtnRef}
                onClick={handleConfirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
