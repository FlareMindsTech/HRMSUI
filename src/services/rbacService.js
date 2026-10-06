import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Fetch Current Authenticated User & Access Context (Role, Menus, Permissions)
 * Backend contract (locked): GET /auth/me -> { data: { user, tenant } }.
 * user carries permissions[] + menus[] as string codes, priority, roleCode,
 * organizationId, branchId, assignedBranchIds.
 */
export const fetchAuthContext = async () => {
  const res = await apiFetch("/auth/me", { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load authentication context");
  }
  return res.data?.data;
};

/**
 * Fetch Permission Catalog Grouped by Module
 */
export const fetchPermissionCatalog = async () => {
  const res = await apiFetch("/permission/catalog", { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load permission catalog");
  }
  return res.data?.data;
};

/**
 * Fetch All Available Menus (+ NEW filtered variant).
 * Recommended filter contract: isActive, isBlock, search (menuName/menuCode).
 */
export const fetchAllMenus = async (params = {}) => {
  const res = await apiFetch(`/menu/getAll-menu${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load menus");
  }
  return res.data?.data;
};

/**
 * Fetch All Roles with access summary (+ NEW filtered variant).
 * Recommended filter contract: search (roleName/roleCode), isActive,
 * isSystemRole, priority, accessLevel, page, limit.
 */
export const fetchAllRoles = async (params = {}) => {
  const res = await apiFetch(`/role${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load roles");
  }
  return res.data?.data;
};

/**
 * Fetch Roles Available for Assignment Based on Logged-in User's Authority
 * (+ NEW filtered variant: search, priority).
 */
export const fetchAssignableRoles = async (params = {}) => {
  const res = await apiFetch(`/role/assignable-roles${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load assignable roles");
  }
  return res.data?.data || [];
};

/**
 * Fetch all permissions (flat list, + NEW filtered variant: module, isActive, search).
 */
export const fetchAllPermissions = async (params = {}) => {
  const res = await apiFetch(`/permission${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load permissions");
  }
  return res.data?.data;
};

/**
 * Fetch all role-menu mappings (+ NEW filtered variant: roleId, menuId).
 */
export const fetchRoleMenus = async (params = {}) => {
  const res = await apiFetch(`/rolemenu${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load role-menu mappings");
  }
  return res.data?.data;
};

/**
 * Fetch a single role by id (pre-check before opening the editor:
 * 404 = deleted, 403 = cross-org).
 */
export const fetchRoleById = async (roleId) => {
  const res = await apiFetch(`/role/${roleId}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load role");
  }
  return res.data?.data;
};

/**
 * Fetch Complete Role Access Configuration.
 * Canonical: GET /role/:id/access (fallback: GET /role/:id).
 */
export const fetchRoleAccessConfig = async (roleId) => {
  const res = await apiFetch(`/role/${roleId}/access`, { method: "GET" });
  if (!res.ok) {
    const fallback = await apiFetch(`/role/${roleId}`, { method: "GET" });
    if (!fallback.ok) throw apiError(res, "Failed to load role configuration");
    return fallback.data?.data;
  }
  return res.data?.data;
};

// POST helper that tries canonical + aliases in order:
// /role -> /role/create -> /role/custom-role
const postRoleCreate = async (payload) => {
  const paths = ["/role", "/role/create", "/role/custom-role"];
  let lastRes = null;
  for (const p of paths) {
    const res = await apiFetch(p, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) return res;
    lastRes = res;
    // Only fall through on 404 (alias missing); surface other errors immediately
    // so validation/403s (reserved codes, hierarchy) are never masked.
    if (res.status !== 404) throw apiError(res, "Failed to create custom role");
  }
  throw apiError(lastRes, "Failed to create custom role");
};

// PUT helper: /role/:id -> /role/update/:id -> /role/custom-role/:id
const putRoleUpdate = async (roleId, payload) => {
  const paths = [`/role/${roleId}`, `/role/update/${roleId}`, `/role/custom-role/${roleId}`];
  let lastRes = null;
  for (const p of paths) {
    const res = await apiFetch(p, { method: "PUT", body: JSON.stringify(payload) });
    if (res.ok) return res;
    lastRes = res;
    if (res.status !== 404) throw apiError(res, "Failed to update custom role");
  }
  throw apiError(lastRes, "Failed to update custom role");
};

// DELETE helper: /role/:id -> /role/delete/:id
const deleteRoleReq = async (roleId) => {
  const paths = [`/role/${roleId}`, `/role/delete/${roleId}`];
  let lastRes = null;
  for (const p of paths) {
    const res = await apiFetch(p, { method: "DELETE" });
    if (res.ok) return res;
    lastRes = res;
    if (res.status !== 404) throw apiError(res, "Failed to delete role");
  }
  throw apiError(lastRes, "Failed to delete role");
};

/**
 * Create Custom Role with Menus and Permissions.
 * Backend: non-platform creators blocked from reserved substrings
 * ADMIN|OWNER|SAAS|PLATFORM|SUPER and from `*` / `platform.*`.
 */
export const createCustomRole = async ({ roleName, description, priority, accessLevel, menuIds, permissionCodes }) => {
  const res = await postRoleCreate({ roleName, description, priority, accessLevel, menuIds, permissionCodes });
  return res.data;
};

/**
 * Update Custom Role with Menus and Permissions (roleCode immutable server-side).
 */
export const updateCustomRole = async (roleId, { roleName, description, priority, isActive, accessLevel, menuIds, permissionCodes }) => {
  const res = await putRoleUpdate(roleId, { roleName, description, priority, isActive, accessLevel, menuIds, permissionCodes });
  return res.data;
};

/**
 * Delete Custom Role
 */
export const deleteCustomRole = async (roleId) => {
  const res = await deleteRoleReq(roleId);
  return res.data;
};

// ---- Client-side mirrors of backend Utils/RoleAuthority.js (pre-flight only;
// backend is the enforcer — these just disable invalid choices early) ----

export const RESERVED_CODE_SUBSTRINGS = ["ADMIN", "OWNER", "SAAS", "PLATFORM", "SUPER"];

export const isReservedRoleCode = (code = "") =>
  RESERVED_CODE_SUBSTRINGS.some((s) => String(code).toUpperCase().includes(s));

const getPriority = (user) => user?.priority ?? 99;
const getRoleCode = (user) => String(user?.roleCode || user?.role?.roleCode || "").toUpperCase();

/** Mirror of canAssignRole: Owner all except SAAS/OWNER; Admin only P>2; HR EMPLOYEE only. */
export const canAssignRole = (actor, targetRole) => {
  if (!actor || !targetRole) return false;
  const aCode = getRoleCode(actor);
  const aPri = getPriority(actor);
  const tCode = String(targetRole.roleCode || targetRole.code || "").toUpperCase();
  const tPri = targetRole.priority ?? 99;
  if (aCode === "SAAS_SUPER_ADMIN") return tCode !== "OWNER";
  if (aCode === "OWNER" || aPri === 1) return !["SAAS_SUPER_ADMIN", "OWNER"].includes(tCode);
  if (aCode === "ADMIN" || aPri === 2) return tPri > 2;
  if (aCode === "HR" || aPri === 3) return tCode === "EMPLOYEE";
  return false;
};

/** Minimum priority the actor may create (P2 Admin -> >=3, P1 Owner -> >=2). */
export const minCreatablePriority = (actor) => {
  const aPri = getPriority(actor);
  const aCode = getRoleCode(actor);
  if (aCode === "SAAS_SUPER_ADMIN") return 0;
  if (aCode === "OWNER" || aPri === 1) return 2;
  if (aCode === "ADMIN" || aPri === 2) return 3;
  return 99; // HR and below cannot create roles (isAdmin gate server-side)
};

/** Pre-flight for role create: hierarchy + reserved codes + platform perms. */
export const validateRolePayload = (actor, { roleName, priority, permissionCodes = [] }) => {
  if (!roleName?.trim()) return "Role name is required.";
  const min = minCreatablePriority(actor);
  if ((priority ?? 99) < min) return `Your authority allows priority ${min} and above only.`;
  if (isReservedRoleCode(roleName)) return "Role name contains a reserved word (ADMIN, OWNER, SAAS, PLATFORM, SUPER).";
  if (permissionCodes.includes("*") || permissionCodes.some((c) => String(c).startsWith("platform.")))
    return "Platform (*) permissions require platform admin.";
  return null;
};

/**
 * Provision Login Account for an Onboarded Employee
 */
export const provisionUserAccount = async ({ employeeId, roleId, password, isActive }) => {
  const res = await apiFetch("/user/provision-account", {
    method: "POST",
    body: JSON.stringify({ employeeId, roleId, password, isActive }),
  });
  if (!res.ok) {
    throw apiError(res, "Failed to provision login account");
  }
  return res.data;
};

/**
 * Update User Account Status (Activate / Deactivate / Block)
 */
export const updateAccountStatus = async (userId, { isActive, isBlocked }) => {
  const res = await apiFetch(`/user/account-status/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ isActive, isBlocked }),
  });
  if (!res.ok) {
    throw apiError(res, "Failed to update account status");
  }
  return res.data;
};

/**
 * Reset User Password / Credentials
 */
export const resetAccountCredentials = async (userId, password) => {
  const res = await apiFetch(`/user/reset-credentials/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw apiError(res, "Failed to reset credentials");
  }
  return res.data;
};

/**
 * Assign Role to User (hierarchy enforced server-side via canAssignRole).
 */
export const assignUserRole = async (userId, roleId) => {
  const res = await apiFetch(`/user/v2/updateRole/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ role: roleId }),
  });
  if (!res.ok) {
    throw apiError(res, "Failed to update user role");
  }
  return res.data;
};

/**
 * Fetch Users List for Role Assignment & Account Provisioning
 */
export const fetchAllUsers = async () => {
  const res = await apiFetch("/user/get?limit=100", { method: "GET" });
  if (!res.ok) {
    throw apiError(res, "Failed to load users list");
  }
  return res.data?.data;
};
