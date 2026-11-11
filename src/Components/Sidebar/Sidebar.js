import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  MdDashboard,
  MdAccessTime,
  MdWork,
  MdAssignment,
  MdBusiness,
  MdDomain,
  MdGroups,
  MdEventNote,
  MdPayments,
  MdPersonAdd,
  MdHistoryEdu,
  MdAdminPanelSettings,
  MdAccountTree,
  MdDevices,
  MdSecurity,
  MdReceipt,
  MdAccountBalance,
  MdAssessment,
  MdSettings,
  MdDns,
  MdChevronRight,
  MdChevronLeft,
  MdLogout,
  MdBadge,
  MdPeople,
  MdAttachMoney,
  MdRule,
  MdCheckCircle,
} from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuthUser, selectIsSystemAdmin, useHasMenu, useHasPermission, logout } from '../../redux/slices/authSlice';
import { useBranch } from '../../context/BranchContext';
import { fetchMyLeavesApi, fetchTeamLeavesApi, fetchAllLeavesApi } from '../../Api/leave/leave';
import './Sidebar.css';

/* ==========================================================================
   NAVIGATION SCHEMA — High Fidelity, Clean Enterprise
   ========================================================================== */

const NAV_SECTIONS = {
  home: {
    tag: 'DASHBOARD',
    title: 'Dashboard',
    subtitle: 'Workspace metrics & activity',
    icon: MdDashboard,
    theme: 'amber',
    groups: [
      {
        header: 'WORKSPACES',
        items: [
          { name: 'Dashboard Overview', path: '/dashboard', icon: MdDashboard, exact: true },
          { name: 'Daily Attendance', path: '/attendance', icon: MdAccessTime },
          { name: 'Leave Requests', path: '/leave', icon: MdEventNote },
          { name: 'Projects & Tasks', path: '/projects', icon: MdWork },
        ],
      },
    ],
  },
  people: {
    tag: 'PEOPLE > ORGANISATION',
    title: 'Organisation',
    subtitle: 'Branches, policies and setup',
    icon: MdBusiness,
    backLink: { label: 'Back to People', path: '/organisation' },
    theme: 'amber',
    groups: [
      {
        header: 'OVERVIEW',
        items: [
          { name: 'Organisation', path: '/organisation', exact: true, icon: MdBusiness },
          { name: 'Locations & Branches', path: '/organisation/branches', icon: MdDomain },
          { name: 'Members & Staff', path: '/onboarding', icon: MdGroups },
          { name: 'Role Management', path: '/roles', icon: MdAdminPanelSettings },
        ],
      },
      {
        header: 'STRUCTURE',
        items: [
          { name: 'Departments', path: '/organisation/departments', icon: MdAccountTree },
          { name: 'Designations', path: '/organisation/designations', icon: MdBadge },
          { name: 'Teams', path: '/organisation/teams', icon: MdPeople },
          { name: 'Reporting Hierarchy', path: '/organisation/hierarchy', icon: MdAccountTree },
        ],
      },
      {
        header: 'WORKPLACE & POLICIES',
        items: [
          { name: 'Work Calendars', path: '/organisation/work-calendars', icon: MdEventNote },
          { name: 'Shifts', path: '/organisation/shifts', icon: MdAccessTime },
          { name: 'Holiday Calendars', path: '/organisation/holidays', icon: MdEventNote },
          { name: 'Leave Settings', path: '/organisation/leave-settings', icon: MdEventNote },
        ],
      },
      {
        header: 'HR MASTERS & FINANCE',
        items: [
          { name: 'Job Grades', path: '/organisation/job-grades', icon: MdBadge },
          { name: 'Cost Centers', path: '/organisation/cost-centers', icon: MdAttachMoney },
          { name: 'Financial Years', path: '/organisation/financial-years', icon: MdAccountBalance },
        ],
      },
    ],
  },
  time: {
    tag: 'TIME & ATTENDANCE',
    title: 'Attendance',
    subtitle: 'Hours, roster and leave requests',
    icon: MdAccessTime,
    theme: 'amber',
    groups: [
      {
        header: 'TIME & ATTENDANCE',
        items: [
          {
            name: 'Attendance',
            path: '/attendance',
            icon: MdAccessTime,
            children: [
              { name: 'Overview', path: '/attendance?tab=overview', tabKey: 'overview', icon: MdDashboard },
              { name: 'Daily Attendance', path: '/attendance?tab=daily', tabKey: 'daily', icon: MdAccessTime },
              { name: 'Exceptions', path: '/attendance?tab=exceptions', tabKey: 'exceptions', icon: MdRule },
              { name: 'Regularization', path: '/attendance?tab=regularization', tabKey: 'regularization', icon: MdCheckCircle },
              { name: 'Overtime', path: '/attendance?tab=overtime', tabKey: 'overtime', icon: MdHistoryEdu },
              { name: 'Audit Log', path: '/attendance?tab=audit', tabKey: 'audit', icon: MdSecurity },
              { name: 'Optional Holidays', path: '/attendance?tab=optional-holidays', tabKey: 'optional-holidays', icon: MdEventNote },
            ],
          },
          { name: 'Leave Requests', path: '/leave', icon: MdEventNote },
        ],
      },
    ],
  },
  project: {
    tag: 'PROJECTS & DELIVERY',
    title: 'Project',
    subtitle: 'Sprints, tasks and delivery',
    icon: MdWork,
    theme: 'amber',
    groups: [
      {
        header: 'PROJECT MANAGEMENT',
        items: [
          { name: 'Projects Overview', path: '/projects', icon: MdWork, exact: true },
          { name: 'Tasks & Sprints', path: '/tasks', icon: MdAssignment },
        ],
      },
    ],
  },
  finance: {
    tag: 'FINANCE',
    title: 'Finance',
    subtitle: 'Payroll, claims and statutory',
    icon: MdReceipt,
    theme: 'amber',
    groups: [
      {
        header: 'PAYROLL & STATUTORY',
        items: [
          { name: 'Payslip', path: '/payslip', icon: MdReceipt },
          { name: 'EPFO', path: '/epfo', icon: MdAccountBalance },
          { name: 'Tax Declarations', path: '/payslip?tab=tax', icon: MdEventNote },
        ],
      },
      {
        header: 'CLAIMS & EXPENSES',
        items: [
          { name: 'Reimbursements', path: '/reimbursement', icon: MdPayments },
          { name: 'Advance Requests', path: '/reimbursement?tab=advances', icon: MdAttachMoney },
        ],
      },
      {
        header: 'REPORTS',
        items: [
          { name: 'MIS Reporting', path: '/mis', icon: MdAssessment },
        ],
      },
    ],
  },
  control: {
    tag: 'CONTROL',
    title: 'Control',
    subtitle: 'Approvals, audits and security',
    icon: MdAccountTree,
    theme: 'amber',
    groups: [
      {
        header: 'GOVERNANCE',
        items: [
          { name: 'Approval Workflows', path: '/approval-workflows', icon: MdAccountTree, badge: 14, badgeBrand: true },
          { name: 'Audit Logs', path: '/audit-logs', icon: MdSecurity },
          { name: 'Lifecycle & Separation', path: '/lifecycle', icon: MdHistoryEdu },
        ],
      },
      {
        header: 'SYSTEM & ASSETS',
        items: [
          { name: 'Asset Management', path: '/assets', icon: MdDevices },
          { name: 'Settings', path: '/settings', icon: MdSettings },
          { name: 'Platform Admin', path: '/platform', icon: MdDns, isPlatformOnly: true },
        ],
      },
    ],
  },
};

// Helper: map path to top nav section
const getSectionFromPath = (pathname) => {
  if (pathname === '/dashboard' || pathname === '/') return 'home';
  if (['/organisation', '/branches', '/onboarding'].some((p) => pathname.startsWith(p))) return 'people';
  if (['/attendance', '/leave'].some((p) => pathname.startsWith(p))) return 'time';
  if (['/projects', '/tasks'].some((p) => pathname.startsWith(p))) return 'project';
  if (['/payslip', '/epfo', '/mis', '/reimbursement'].some((p) => pathname.startsWith(p))) return 'finance';
  if (['/roles'].some((p) => pathname.startsWith(p))) return 'people';
  if (['/approval-workflows', '/audit-logs', '/assets', '/users', '/lifecycle', '/platform', '/settings', '/subscription-renewal'].some((p) => pathname.startsWith(p))) return 'control';
  return 'home';
};

export default function Sidebar({
  isHovered = false,
  isPinned = false,
  isMobileOpen = false,
  onClose,
  onTogglePin,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasPermission = useHasPermission();
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  // Active top-nav section
  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(location.pathname));

  const isExpanded = isHovered || isPinned || isMobileOpen;

  useEffect(() => {
    let isMounted = true;
    const loadPendingLeaveCount = async () => {
      const isOwner = user?.priority === 1 || user?.roleCode === 'OWNER';
      const canReadAll = isOwner || hasPermission('leave.read.all') || hasPermission('*');
      const canReadTeam = hasPermission('leave.read.team');
      const canReadOwn = !isOwner && (hasPermission('leave.read.own') || hasPermission('leave.create.own'));

      try {
        const response = canReadAll
          ? await fetchAllLeavesApi()
          : canReadTeam
          ? await fetchTeamLeavesApi()
          : canReadOwn
          ? await fetchMyLeavesApi()
          : null;
        const leaves = Array.isArray(response?.data) ? response.data : [];
        const count = leaves.filter((leave) => {
          const status = String(leave?.status || '').toUpperCase();
          return status === 'PENDING' || status === 'SUBMITTED' || status === 'PENDING_APPROVAL';
        }).length;
        if (isMounted) setPendingLeaveCount(count);
      } catch (error) {
        if (isMounted) {
          setPendingLeaveCount(0);
          console.warn('Sidebar leave count unavailable:', error);
        }
      }
    };

    loadPendingLeaveCount();
    return () => {
      isMounted = false;
    };
  }, [hasPermission, user]);

  // Submenu toggle state
  const [openSubMenus, setOpenSubMenus] = useState({
    '/attendance': true,
    '/projects': location.pathname.startsWith('/projects'),
  });

  // Track route changes
  useEffect(() => {
    const sec = getSectionFromPath(location.pathname);
    setActiveSection(sec);
    if (location.pathname.startsWith('/attendance')) {
      setOpenSubMenus((prev) => ({ ...prev, '/attendance': true }));
    }
  }, [location.pathname]);

  // Listen for top nav explicit section click events
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.section) setActiveSection(e.detail.section);
    };
    window.addEventListener('teamhub:nav-section', handler);
    return () => window.removeEventListener('teamhub:nav-section', handler);
  }, []);

  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const confirmBtnRef = useRef(null);

  // Focus trap for sign-out dialog
  useEffect(() => {
    if (showSignoutModal && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [showSignoutModal]);

  // Keyboard accessibility for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSignoutModal) {
        if (e.key === 'Escape') setShowSignoutModal(false);
        if (e.key === 'Enter') handleConfirmLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSignoutModal]);

  const toggleSubMenu = (path, currentComputedOpen, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenSubMenus((prev) => ({
      ...prev,
      [path]: prev[path] !== undefined ? !prev[path] : !currentComputedOpen,
    }));
  };

  const isVisible = (item) => {
    if (item.isPlatformOnly) {
      const roleCode = (user?.roleCode || user?.role?.roleCode || '').toUpperCase();
      return roleCode === 'SAAS_SUPER_ADMIN' || (user?.scope === 'PLATFORM' && !user?.organizationId);
    }
    return true;
  };

  const handleConfirmLogout = () => {
    setShowSignoutModal(false);
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const { branches } = useBranch();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const branchId = searchParams.get('branchId');
  const currentTab = searchParams.get('tab') || 'overview';
  const isBranchActive = location.pathname.startsWith('/organisation/branches') && Boolean(branchId);
  const currentBranch = useMemo(() => {
    if (!branchId || !Array.isArray(branches)) return null;
    return branches.find((b) => String(b._id || b.id) === String(branchId)) || null;
  }, [branches, branchId]);
  const branchName = currentBranch?.branchName || 'Branch Hub';

  const branchSection = useMemo(() => {
    if (!branchId) return null;
    return {
      tag: 'BRANCH WORKSPACE',
      title: branchName,
      subtitle: currentBranch?.branchCode ? `Branch Code: ${currentBranch.branchCode}` : 'Facility & local operations',
      icon: MdDomain,
      theme: 'amber',
      backLink: { label: 'Back to All Branches', path: '/organisation/branches' },
      groups: [
        {
          header: 'BRANCH OVERVIEW',
          items: [
            {
              name: 'Branch Overview',
              path: `/organisation/branches?branchId=${branchId}`,
              tabKey: 'overview',
              icon: MdDomain,
              children: [
                {
                  name: 'Branch Overview',
                  path: `/organisation/branches?branchId=${branchId}&tab=overview`,
                  tabKey: 'overview',
                  icon: MdDomain,
                },
                {
                  name: 'Branch Members & Staff',
                  path: `/organisation/branches?branchId=${branchId}&tab=members`,
                  tabKey: 'members',
                  icon: MdGroups,
                },
                {
                  name: 'Departments',
                  path: `/organisation/branches?branchId=${branchId}&tab=departments`,
                  tabKey: 'departments',
                  icon: MdAccountTree,
                },
                {
                  name: 'Designations',
                  path: `/organisation/branches?branchId=${branchId}&tab=designations`,
                  tabKey: 'designations',
                  icon: MdBadge,
                },
                {
                  name: 'Teams',
                  path: `/organisation/branches?branchId=${branchId}&tab=teams`,
                  tabKey: 'teams',
                  icon: MdPeople,
                },
                {
                  name: 'Reporting Hierarchy',
                  path: `/organisation/branches?branchId=${branchId}&tab=reporting`,
                  tabKey: 'reporting',
                  icon: MdAccountTree,
                },
                {
                  name: 'Locations',
                  path: `/organisation/branches?branchId=${branchId}&tab=locations`,
                  tabKey: 'locations',
                  icon: MdDomain,
                },
                {
                  name: 'Work Calendar',
                  path: `/organisation/branches?branchId=${branchId}&tab=work-calendars`,
                  tabKey: 'work-calendars',
                  icon: MdEventNote,
                },
                {
                  name: 'Shifts',
                  path: `/organisation/branches?branchId=${branchId}&tab=shifts`,
                  tabKey: 'shifts',
                  icon: MdAccessTime,
                },
                {
                  name: 'Holiday Calendars',
                  path: `/organisation/branches?branchId=${branchId}&tab=holidays`,
                  tabKey: 'holidays',
                  icon: MdEventNote,
                },
                {
                  name: 'Leave Settings',
                  path: `/organisation/branches?branchId=${branchId}&tab=leave-settings`,
                  tabKey: 'leave-settings',
                  icon: MdEventNote,
                },
                {
                  name: 'Job Grades',
                  path: `/organisation/branches?branchId=${branchId}&tab=job-grades`,
                  tabKey: 'job-grades',
                  icon: MdBadge,
                },
                {
                  name: 'Cost Centers',
                  path: `/organisation/branches?branchId=${branchId}&tab=cost-centers`,
                  tabKey: 'cost-centers',
                  icon: MdAttachMoney,
                },
                {
                  name: 'Financial Years',
                  path: `/organisation/branches?branchId=${branchId}&tab=financial-years`,
                  tabKey: 'financial-years',
                  icon: MdAccountBalance,
                },
                {
                  name: 'Branch Settings',
                  path: `/organisation/branches?branchId=${branchId}&tab=settings`,
                  tabKey: 'settings',
                  icon: MdSettings,
                },
              ],
            },
          ],
        },
        ...(Array.isArray(branches) && branches.length > 1
          ? [
              {
                header: 'BRANCHES',
                items: [
                  {
                    name: 'Switch Branch',
                    path: '/organisation/branches',
                    icon: MdDomain,
                    badge: `${branches.length}`,
                    children: [
                      {
                        name: 'All Branches Directory',
                        path: '/organisation/branches',
                        exact: true,
                        icon: MdDomain,
                      },
                      ...branches.map((b) => ({
                        name: b.branchName,
                        path: `/organisation/branches?branchId=${b._id || b.id}&tab=overview`,
                        icon: MdDomain,
                        badge: b.branchCode,
                        branchId: String(b._id || b.id),
                      })),
                    ],
                  },
                ],
              },
            ]
          : []),
      ],
    };
  }, [branchId, branchName, currentBranch, branches]);

  const peopleSection = useMemo(() => {
    const base = NAV_SECTIONS.people;
    if (!base) return base;

    const branchItems = Array.isArray(branches) && branches.length > 0
      ? branches.map((b) => ({
          name: b.branchName,
          path: `/organisation/branches?branchId=${b._id || b.id}&tab=overview`,
          icon: MdDomain,
          badge: b.branchCode,
          branchId: String(b._id || b.id),
        }))
      : [];

    return {
      ...base,
      groups: [
        {
          header: 'OVERVIEW',
          items: [
            { name: 'Organisation', path: '/organisation', exact: true, icon: MdBusiness },
            {
              name: 'Locations & Branches',
              path: '/organisation/branches',
              icon: MdDomain,
              exact: true,
              badge: branchItems.length > 0 ? `${branchItems.length}` : undefined,
              children: [
                {
                  name: 'All Branches Directory',
                  path: '/organisation/branches',
                  exact: true,
                  icon: MdDomain,
                },
                ...branchItems,
              ],
            },
            { name: 'Members & Staff', path: '/onboarding', icon: MdGroups },
            { name: 'Role Management', path: '/roles', icon: MdAdminPanelSettings },
          ],
        },
        ...base.groups.slice(1),
      ],
    };
  }, [branches]);

  const currentSection =
    isBranchActive && branchSection
      ? branchSection
      : activeSection === 'people'
      ? peopleSection
      : NAV_SECTIONS[activeSection] || NAV_SECTIONS.home;
  const SectionIcon = currentSection.icon || MdBusiness;
  const displayName = user?.name || user?.fullName || 'FM Sagadhevan';
  const displayRole = user?.roleName || user?.roleCode || 'Owner · Head Office';

  const avatarBg = '#FFFFFF';

  return (
    <>
      <aside
        className={`th-sidebar ${isExpanded ? 'is-expanded' : 'is-rail'} th-sidebar-theme-${currentSection.theme}`}
        aria-label="Application Section Navigation"
      >
        {/* ── Scrollable Navigation Tree ── */}
        <nav className="th-sb-nav-scroll">
          {currentSection.groups.map((group, gIdx) => (
            <div key={gIdx} className="th-sb-group">
              {group.header && (
                <div className="th-sb-group-header">{group.header}</div>
              )}

              <div className="th-sb-items-list">
                {group.items.filter(isVisible).map((item) => {
                  const Icon = item.icon || MdBusiness;
                  const badgeValue = item.name === 'Leave Requests' ? pendingLeaveCount : item.badge;
                  const shouldShowBadge = item.name === 'Leave Requests' ? pendingLeaveCount > 0 : Boolean(item.badge);
                  const hasChildren = item.children && item.children.length > 0;
                  const itemBase = item.path.split('?')[0];
                  const isOpen = openSubMenus[item.path] !== undefined
                    ? Boolean(openSubMenus[item.path])
                    : Boolean(
                        openSubMenus[itemBase] ||
                        (itemBase === '/attendance' && location.pathname.startsWith('/attendance')) ||
                        (isBranchActive && (item.tabKey === 'overview' || item.path.includes('branchId')))
                      );

                  // Determine active status
                  let isActive = false;
                  if (item.branchId) {
                    isActive = searchParams.get('branchId') === item.branchId;
                  } else if (isBranchActive && item.tabKey) {
                    isActive = currentTab === item.tabKey;
                  } else if (item.exact) {
                    isActive = location.pathname === item.path && !searchParams.get('branchId');
                  } else if (item.children) {
                    isActive = location.pathname.startsWith(itemBase) && !searchParams.get('branchId');
                  } else {
                    isActive = location.pathname === item.path ||
                      (item.path !== '/organisation' && location.pathname.startsWith(item.path));
                  }

                  const submenuId = hasChildren ? `th-sub-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined;

                  return (
                    <div key={item.path} className="th-sb-item-wrapper">
                      <button
                        type="button"
                        className={`th-sb-item-btn ${isActive ? 'is-active' : ''}`}
                        aria-expanded={hasChildren ? isOpen : undefined}
                        aria-controls={hasChildren ? submenuId : undefined}
                        onClick={() => {
                          if (hasChildren) {
                            setOpenSubMenus((prev) => ({
                              ...prev,
                              [item.path]: prev[item.path] !== undefined ? !prev[item.path] : !isOpen,
                            }));
                          }
                          navigate(item.path);
                        }}
                        title={item.name}
                      >
                        {/* Always visible: Symbol/Icon */}
                        <span className="th-sb-item-icon">
                          <Icon size={18} />
                        </span>

                        {/* Hover only: Full Wording */}
                        <div className="th-sb-item-wording">
                          <span className="th-sb-item-label">{item.name}</span>

                          {shouldShowBadge && (
                            <span className={`th-sb-badge ${item.badgeBrand ? 'is-brand' : ''}`}>
                              {badgeValue}
                            </span>
                          )}

                          {hasChildren && (
                            <span
                              className={`th-sb-chevron ${isOpen ? 'is-open' : ''}`}
                              onClick={(e) => toggleSubMenu(item.path, isOpen, e)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleSubMenu(item.path, isOpen, e);
                                }
                              }}
                              aria-label={isOpen ? `Collapse ${item.name} sub-options` : `Expand ${item.name} sub-options`}
                            >
                              <MdChevronRight size={16} />
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Sub-menu if expanded (shown on hover) */}
                      {hasChildren && isOpen && (
                        <div id={submenuId} className="th-sb-sub-menu" role="group" aria-label={`${item.name} sub-options`}>
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childBase = child.path.split('?')[0];
                            const childQuery = child.path.includes('?') ? new URLSearchParams(child.path.split('?')[1]) : null;
                            const childTab = child.tabKey || (childQuery ? childQuery.get('tab') : null);
                            const activeTabParam = searchParams.get('tab');

                            let isChildActive = false;
                            if (child.branchId) {
                              isChildActive = searchParams.get('branchId') === child.branchId;
                            } else if (childTab) {
                              const isTabMatch = activeTabParam
                                ? activeTabParam === childTab
                                : childTab === 'overview';
                              isChildActive = location.pathname === childBase && isTabMatch;
                            } else if (child.exact) {
                              isChildActive = location.pathname === child.path && !searchParams.get('branchId');
                            } else {
                              isChildActive = location.pathname.startsWith(child.path);
                            }

                            return (
                              <button
                                key={child.path}
                                type="button"
                                className={`th-sb-sub-btn ${isChildActive ? 'is-active' : ''}`}
                                onClick={() => navigate(child.path)}
                                title={child.name}
                              >
                                {ChildIcon ? (
                                  <ChildIcon size={14} className="th-sb-sub-icon" />
                                ) : (
                                  <span className="th-sb-sub-dot">•</span>
                                )}
                                <span className="th-sb-sub-label">{child.name}</span>
                                {child.badge && (
                                  <span className="th-sb-badge ms-auto" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                    {child.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom Section: User Card (Symbols only when unhovered) ── */}
        <div className="th-sb-bottom-block">
          <div className="th-sb-user-card">
            <div
              className="th-sb-avatar"
              style={{ backgroundColor: avatarBg, color: '#0F1F18' }}
              title={`${displayName} (${displayRole}) — Click to sign out`}
              role="button"
              tabIndex={0}
              onClick={() => setShowSignoutModal(true)}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            {/* Hover only: Full user info and signout */}
            <div className="th-sb-user-wording">
              <div className="th-sb-user-info">
                <span className="th-sb-user-name">{displayName}</span>
                <span className="th-sb-user-role">{displayRole}</span>
              </div>
              <button
                type="button"
                className="th-sb-logout-btn"
                onClick={() => setShowSignoutModal(true)}
                title="Sign out of TeamHub"
                aria-label="Sign out"
              >
                <MdLogout size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

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
