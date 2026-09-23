import { apiFetch } from "../config/api";

/**
 * Access Control & Branch Access Service
 * 
 * Provides centralized API integration for User Organization & Branch Access.
 */

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val);
    }
  });
  const qStr = query.toString();
  return qStr ? `?${qStr}` : "";
};

/**
 * Fetch access configuration for a specific user (GET /users/:userId/access or fallback /user/:userId/access)
 * Returns { organizationId, accessLevel, primaryBranchId, branchIds, user, organization, branches }
 */
export const fetchUserAccess = async (userId) => {
  if (!userId) throw new Error("User ID is required to fetch access details");
  
  // Try /users/:userId/access first, then /user/:userId/access
  let res = await apiFetch(`/users/${userId}/access`, { method: "GET" });
  if (!res.ok) {
    res = await apiFetch(`/user/${userId}/access`, { method: "GET" });
  }
  if (!res.ok) {
    // If dedicated access endpoint returns 404, fallback to user profile /user/:userId
    res = await apiFetch(`/user/${userId}`, { method: "GET" });
  }

  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load user access configuration");
  }

  const data = res.data?.data || res.data || {};
  return {
    organizationId: data.organizationId?._id || data.organizationId || data.organization?._id || data.organization || data.tenantId || null,
    accessLevel: data.accessLevel || (data.primaryBranchId || (data.branchIds && data.branchIds.length > 0) ? "BRANCH" : "ORGANIZATION"),
    primaryBranchId: data.primaryBranchId?._id || data.primaryBranchId || null,
    branchIds: Array.isArray(data.branchIds)
      ? data.branchIds.map((b) => (typeof b === "object" && b !== null ? b._id || b.id : b)).filter(Boolean)
      : [],
    organization: data.organization || data.organizationId || null,
    branches: data.branches || [],
    raw: data,
  };
};

/**
 * Update access configuration for a specific user (PUT /users/:userId/access or fallback /user/:userId/access)
 * @param {string} userId 
 * @param {Object} payload - { organizationId, accessLevel, primaryBranchId, branchIds }
 */
export const updateUserAccess = async (userId, payload) => {
  if (!userId) throw new Error("User ID is required to update access details");

  const normalizedPayload = {
    organizationId: payload.organizationId || undefined,
    accessLevel: payload.accessLevel === "ORGANIZATION" ? "ORGANIZATION" : "BRANCH",
    primaryBranchId: payload.accessLevel === "ORGANIZATION" ? null : (payload.primaryBranchId || null),
    branchIds: payload.accessLevel === "ORGANIZATION" ? [] : (Array.isArray(payload.branchIds) ? payload.branchIds : []),
  };

  let res = await apiFetch(`/users/${userId}/access`, {
    method: "PUT",
    body: JSON.stringify(normalizedPayload),
  });

  if (!res.ok) {
    res = await apiFetch(`/user/${userId}/access`, {
      method: "PUT",
      body: JSON.stringify(normalizedPayload),
    });
  }

  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update user access configuration");
  }

  return res.data;
};

/**
 * Fetch all accessible branches for the current organization or specific organization
 */
export const fetchAccessibleBranches = async (params = {}) => {
  let res = await apiFetch(`/branches/dropdown${buildQuery(params)}`, { method: "GET" });
  if (res.ok && res.data?.data) {
    return res.data.data;
  }

  // Fallback to /branches
  res = await apiFetch(`/branches${buildQuery({ limit: 100, status: "ACTIVE", ...params })}`, { method: "GET" });
  if (res.ok) {
    return res.data?.data || res.data || [];
  }

  return [];
};

/**
 * Fetch organizations list (if available or for selection)
 */
export const fetchOrganizationsList = async () => {
  let res = await apiFetch("/organizations", { method: "GET" });
  if (!res.ok) {
    res = await apiFetch("/organization", { method: "GET" });
  }
  if (!res.ok) {
    res = await apiFetch("/organization/me", { method: "GET" });
  }
  if (!res.ok) return [];

  const data = res.data?.data || res.data;
  return Array.isArray(data) ? data : data ? [data] : [];
};
