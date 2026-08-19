import { apiFetch } from "../config/api";

/**
 * Fetch Current Authenticated User & Access Context (Role, Menus, Permissions)
 */
export const fetchAuthContext = async () => {
  const res = await apiFetch("/auth/me", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load authentication context");
  }
  return res.data?.data;
};

/**
 * Fetch Permission Catalog Grouped by Module
 */
export const fetchPermissionCatalog = async () => {
  const res = await apiFetch("/permission/catalog", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load permission catalog");
  }
  return res.data?.data;
};

/**
 * Fetch All Available Menus
 */
export const fetchAllMenus = async () => {
  const res = await apiFetch("/menu/getAll-menu", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load menus");
  }
  return res.data?.data;
};

/**
 * Fetch All Roles with access summary
 */
export const fetchAllRoles = async () => {
  const res = await apiFetch("/role", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load roles");
  }
  return res.data?.data;
};

/**
 * Fetch Roles Available for Assignment Based on Logged-in User's Authority
 */
export const fetchAssignableRoles = async () => {
  const res = await apiFetch("/role/assignable-roles", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load assignable roles");
  }
  return res.data?.data || [];
};

/**
 * Fetch Complete Role Access Configuration
 */
export const fetchRoleAccessConfig = async (roleId) => {
  const res = await apiFetch(`/role/${roleId}/access`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load role configuration");
  }
  return res.data?.data;
};

/**
 * Create Custom Role with Menus and Permissions
 */
export const createCustomRole = async ({ roleName, description, priority, menuIds, permissionCodes }) => {
  const res = await apiFetch("/role/custom-role", {
    method: "POST",
    body: JSON.stringify({ roleName, description, priority, menuIds, permissionCodes }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to create custom role");
  }
  return res.data;
};

/**
 * Update Custom Role with Menus and Permissions
 */
export const updateCustomRole = async (roleId, { roleName, description, priority, isActive, menuIds, permissionCodes }) => {
  const res = await apiFetch(`/role/custom-role/${roleId}`, {
    method: "PUT",
    body: JSON.stringify({ roleName, description, priority, isActive, menuIds, permissionCodes }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update custom role");
  }
  return res.data;
};

/**
 * Delete Custom Role
 */
export const deleteCustomRole = async (roleId) => {
  const res = await apiFetch(`/role/${roleId}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to delete role");
  }
  return res.data;
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
    throw new Error(res.data?.message || "Failed to provision login account");
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
    throw new Error(res.data?.message || "Failed to update account status");
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
    throw new Error(res.data?.message || "Failed to reset credentials");
  }
  return res.data;
};

/**
 * Assign Role to User
 */
export const assignUserRole = async (userId, roleId) => {
  const res = await apiFetch(`/user/v2/updateRole/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ role: roleId }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update user role");
  }
  return res.data;
};

/**
 * Fetch Users List for Role Assignment & Account Provisioning
 */
export const fetchAllUsers = async () => {
  const res = await apiFetch("/user/get?limit=100", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load users list");
  }
  return res.data?.data;
};
