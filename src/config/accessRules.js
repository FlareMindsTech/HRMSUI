/**
 * Centralized navigation / route authorization rules.
 *
 * The sidebar, top navigation and the route boundary all consult this module
 * so a menu that is hidden is also unreachable by typing its URL. Rules are
 * deliberately menu-first for top-level modules (custom roles may rely on
 * legacy menu assignments) and permission-first for sensitive sub-features.
 */

const normalizeRoleCode = (user) =>
  String(user?.roleCode || user?.roleName || user?.role || '').toUpperCase();

export const buildAccessContext = (user, menus = [], permissions = []) => {
  const roleCode = normalizeRoleCode(user);
  const perms = Array.isArray(permissions) ? permissions : [];
  const menuCodes = Array.isArray(menus) ? menus : [];
  const isOwner =
    user?.priority === 1 ||
    user?.isOwner === true ||
    roleCode === 'OWNER' ||
    perms.includes('*');

  return {
    user,
    roleCode,
    priority: user?.priority,
    menus: menuCodes,
    permissions: perms,
    isOwner,
    isPlatform:
      roleCode === 'SAAS_SUPER_ADMIN' ||
      user?.scope === 'PLATFORM' ||
      perms.includes('platform.admin'),
    isAdminLevel:
      isOwner ||
      user?.priority === 2 ||
      roleCode === 'ADMIN',
  };
};

const permEquals = (stored, wanted) =>
  typeof stored === 'string' && typeof wanted === 'string'
    ? stored.toLowerCase() === wanted.toLowerCase()
    : stored === wanted;

export const hasPermission = (access, code) => {
  if (!access?.user) return false;
  if (access.isOwner) return true;
  if (!code) return true;
  return (access.permissions || []).some((p) => permEquals(p, code));
};

export const hasMenu = (access, code) => {
  if (!access?.user) return false;
  if (access.isOwner) return true;
  return Boolean(code) && (access.menus || []).includes(code);
};

/** Evaluate a rule object: { menu, permission, anyPermissions, adminOnly, platformOnly }. */
export const isRuleAllowed = (access, rule = {}) => {
  if (!access?.user) return false;
  if (rule.platformOnly && !access.isPlatform) return false;
  if (rule.adminOnly && !access.isAdminLevel) return false;
  if (rule.menu && !hasMenu(access, rule.menu)) return false;
  if (rule.permission && !hasPermission(access, rule.permission)) return false;
  if (
    rule.anyPermissions &&
    Array.isArray(rule.anyPermissions) &&
    rule.anyPermissions.length > 0 &&
    !rule.anyPermissions.some((p) => hasPermission(access, p))
  ) {
    return false;
  }
  return true;
};

const SETTINGS_RULE = {
  anyPermissions: ['organizationSettings.view', 'orgSettings.view'],
  adminOnly: true,
};
const APPROVAL_RULE = { anyPermissions: ['approval.configure', 'approval.process'] };
const LIFECYCLE_RULE = { anyPermissions: ['user.manage_status'] };

const ROUTE_RULES = [
  { test: /^\/platform(?:\/|$)/, platformOnly: true },
  { test: /^\/(?:audit-logs|audit)(?:\/|$)/, adminOnly: true },
  { test: /^\/settings(?:\/|$)/, ...SETTINGS_RULE },
  { test: /^\/(?:approval-workflows|approvals)(?:\/|$)/, ...APPROVAL_RULE },
  { test: /^\/(?:lifecycle|resignation|offboarding)(?:\/|$)/, ...LIFECYCLE_RULE },
  { test: /^\/users(?:\/|$)/, menu: 'ROLE_MANAGEMENT' },
  { test: /^\/roles(?:\/|$)/, menu: 'ROLE_MANAGEMENT' },
  { test: /^\/dashboard(?:\/|$)/, menu: 'DASHBOARD' },
  { test: /^\/onboarding(?:\/|$)/, menu: 'USER_MANAGEMENT' },
  { test: /^\/(?:organisation|branches)(?:\/|$)/, menu: 'ORGANISATION' },
  { test: /^\/attendance(?:\/|$)/, menu: 'ATTENDANCE' },
  { test: /^\/(?:projects|tasks)(?:\/|$)/, menu: 'PROJECTS' },
  { test: /^\/leave(?:\/|$)/, menu: 'LEAVE_MGMT' },
  { test: /^\/payslip(?:\/|$)/, menu: 'PAYSLIP' },
  { test: /^\/epfo(?:\/|$)/, menu: 'EPFO' },
  { test: /^\/mis(?:\/|$)/, menu: 'MIS' },
  { test: /^\/assets(?:\/|$)/, menu: 'ASSETS' },
  { test: /^\/reimbursements?(?:\/|$)/, menu: 'REIMBURSEMENT' },
];

/** Decide whether a pathname may render for this access context. */
export const getRouteAccess = (pathname, access) => {
  const path = pathname || '/';
  // The index route immediately redirects to /dashboard, which is checked next.
  if (path === '/' || path === '') return { allowed: true, rule: {} };
  const rule = ROUTE_RULES.find((r) => r.test.test(path));
  if (!rule) return { allowed: true, rule: {} };
  return { allowed: isRuleAllowed(access, rule), rule };
};

/** Ordered fallback paths used when a user requests a forbidden URL. */
export const LANDING_CANDIDATES = [
  { path: '/dashboard', menu: 'DASHBOARD' },
  { path: '/attendance', menu: 'ATTENDANCE' },
  { path: '/projects', menu: 'PROJECTS' },
  { path: '/onboarding', menu: 'USER_MANAGEMENT' },
  { path: '/leave', menu: 'LEAVE_MGMT' },
  { path: '/payslip', menu: 'PAYSLIP' },
  { path: '/epfo', menu: 'EPFO' },
  { path: '/mis', menu: 'MIS' },
  { path: '/assets', menu: 'ASSETS' },
  { path: '/reimbursement', menu: 'REIMBURSEMENT' },
  { path: '/roles', menu: 'ROLE_MANAGEMENT' },
  { path: '/organisation', menu: 'ORGANISATION' },
  { path: '/approval-workflows', ...APPROVAL_RULE },
  { path: '/lifecycle', ...LIFECYCLE_RULE },
  { path: '/audit-logs', adminOnly: true },
  { path: '/settings/organization', ...SETTINGS_RULE },
  { path: '/platform', platformOnly: true },
];

export const getFirstAccessiblePath = (access) => {
  if (access?.isPlatform) return '/platform';
  const candidate = LANDING_CANDIDATES.find((item) =>
    isRuleAllowed(access, item)
  );
  return candidate?.path || null;
};

// Sidebar / top-nav item rules keyed by pathname (query strings stripped).
const NAV_RULES = {
  '/dashboard': { menu: 'DASHBOARD' },
  '/organisation': { menu: 'ORGANISATION' },
  '/organisation/branches': { menu: 'ORGANISATION' },
  '/onboarding': { menu: 'USER_MANAGEMENT' },
  '/roles': { menu: 'ROLE_MANAGEMENT' },
  '/attendance': { menu: 'ATTENDANCE' },
  '/leave': { menu: 'LEAVE_MGMT' },
  '/projects': { menu: 'PROJECTS' },
  '/tasks': { menu: 'PROJECTS' },
  '/payslip': { menu: 'PAYSLIP' },
  '/epfo': { menu: 'EPFO' },
  '/mis': { menu: 'MIS' },
  '/assets': { menu: 'ASSETS' },
  '/reimbursement': { menu: 'REIMBURSEMENT' },
  '/approval-workflows': APPROVAL_RULE,
  '/audit-logs': { adminOnly: true },
  '/lifecycle': LIFECYCLE_RULE,
  '/settings': SETTINGS_RULE,
  '/platform': { platformOnly: true },
};

export const getNavItemRule = (path = '') => {
  const base = String(path).split('?')[0].replace(/\/$/, '');
  if (NAV_RULES[base]) return NAV_RULES[base];
  const match = Object.keys(NAV_RULES)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => base.startsWith(`${prefix}/`));
  return match ? NAV_RULES[match] : {};
};

export const canSeeNavItem = (access, item = {}) => {
  if (!access?.user) return false;
  if (item.isPlatformOnly) return Boolean(access.isPlatform);
  if (item.explicitRule) return isRuleAllowed(access, item.explicitRule);
  return isRuleAllowed(access, getNavItemRule(item.path));
};

export const ATTENDANCE_TAB_RULES = {
  overview: {
    anyPermissions: ['attendance.analytics', 'attendance.read.all', 'attendance.read.team'],
  },
  daily: { anyPermissions: ['attendance.read.all', 'attendance.read.team'] },
  exceptions: { permission: 'attendance.read.team' },
  regularization: {
    anyPermissions: ['attendance.read.own', 'attendance.regularize.apply', 'attendance.modify'],
  },
  overtime: { permission: 'attendance.read.team' },
  audit: { permission: 'attendance.audit' },
  'optional-holidays': { permission: 'attendance.read.own' },
  'my-today': { permission: 'attendance.read.own' },
  'my-calendar': { permission: 'attendance.read.own' },
  'my-history': { permission: 'attendance.read.own' },
  'my-team': { permission: 'attendance.read.team' },
};

export const canSeeAttendanceTab = (access, tabKey = 'overview') => {
  if (!access?.user || !hasMenu(access, 'ATTENDANCE')) return false;
  const rule = ATTENDANCE_TAB_RULES[tabKey];
  // Unknown tabs default to hidden rather than silently exposing a page.
  return rule ? isRuleAllowed(access, rule) : false;
};

// Section-level visibility for the sidebar and top navbar. A section is shown
// only when at least one of its navigation items is visible.
export const SECTION_NAV_ITEMS = {
  home: ['/dashboard', '/attendance', '/leave', '/projects'],
  people: ['/organisation', '/onboarding', '/roles'],
  time: ['/attendance', '/leave'],
  project: ['/projects', '/tasks'],
  finance: ['/payslip', '/epfo', '/mis', '/reimbursement'],
  control: [
    '/approval-workflows',
    '/audit-logs',
    '/assets',
    '/settings',
    '/lifecycle',
    '/platform',
  ],
};

export const canSeeSection = (access, sectionKey) => {
  const paths = SECTION_NAV_ITEMS[sectionKey] || [];
  return paths.some((path) => isRuleAllowed(access, getNavItemRule(path)));
};

/** First accessible route inside a top-nav section (avoids dead links). */
export const getSectionLandingPath = (access, sectionKey) => {
  const paths = SECTION_NAV_ITEMS[sectionKey] || [];
  // Platform-only identities must not be routed into organization modules.
  if (access?.isPlatform && paths.includes('/platform')) return '/platform';
  return paths.find((path) => isRuleAllowed(access, getNavItemRule(path))) || null;
};

const accessRules = {
  buildAccessContext,
  getRouteAccess,
  getFirstAccessiblePath,
  getNavItemRule,
  canSeeNavItem,
  canSeeAttendanceTab,
  canSeeSection,
  getSectionLandingPath,
};

export default accessRules;
