import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Platform Administration (SaaS Super Admin) API Service
 */

export const getPlatformDashboard = async () => {
  const res = await apiFetch("/platform/dashboard", { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load platform dashboard.");
  return res.data;
};

export const getPlatformUsage = async () => {
  const res = await apiFetch("/platform/usage", { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load platform usage.");
  return res.data;
};

export const getPlatformAuditLogs = async (params = {}) => {
  const res = await apiFetch(`/platform/audit-logs${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load platform audit logs.");
  return res.data;
};

export const getPlatformUsers = async (params = {}) => {
  const res = await apiFetch(`/platform/users${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load platform users.");
  return res.data;
};

export const getPlatformOrganizations = async (params = {}) => {
  const res = await apiFetch(`/platform/organizations${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load platform organizations.");
  return res.data;
};

export const getPlatformOrganizationById = async (id) => {
  const res = await apiFetch(`/platform/organizations/${id}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load organization details.");
  return res.data;
};

export const suspendPlatformOrganization = async (id, reason = "") => {
  const res = await apiFetch(`/platform/organizations/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw apiError(res, "Failed to suspend organization.");
  return res.data;
};

export const activatePlatformOrganization = async (id) => {
  const res = await apiFetch(`/platform/organizations/${id}/activate`, {
    method: "PATCH",
  });
  if (!res.ok) throw apiError(res, "Failed to activate organization.");
  return res.data;
};

export const getPlatformPlans = async (params = {}) => {
  const res = await apiFetch(`/platform/plans${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load platform plans.");
  return res.data;
};

export const createPlatformPlan = async (payload) => {
  const res = await apiFetch("/platform/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to create subscription plan.");
  return res.data;
};

export const updatePlatformPlan = async (id, payload) => {
  const res = await apiFetch(`/platform/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to update subscription plan.");
  return res.data;
};

export const updatePlatformPlanStatus = async (id, isActive) => {
  const res = await apiFetch(`/platform/plans/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw apiError(res, "Failed to update plan status.");
  return res.data;
};

export const getPlatformSubscriptions = async (params = {}) => {
  const res = await apiFetch(`/platform/subscriptions${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load subscriptions.");
  return res.data;
};

export const getPlatformSubscriptionById = async (id) => {
  const res = await apiFetch(`/platform/subscriptions/${id}`, { method: "GET" });
  if (!res.ok) throw apiError(res, "Failed to load subscription details.");
  return res.data;
};

export const updatePlatformSubscription = async (id, payload) => {
  const res = await apiFetch(`/platform/subscriptions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to update subscription.");
  return res.data;
};

export const activatePlatformSubscription = async (id) => {
  const res = await apiFetch(`/platform/subscriptions/${id}/activate`, {
    method: "PATCH",
  });
  if (!res.ok) throw apiError(res, "Failed to activate subscription.");
  return res.data;
};

export const suspendPlatformSubscription = async (id, reason = "") => {
  const res = await apiFetch(`/platform/subscriptions/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw apiError(res, "Failed to suspend subscription.");
  return res.data;
};

export const extendPlatformSubscription = async (id, days) => {
  const res = await apiFetch(`/platform/subscriptions/${id}/extend`, {
    method: "PATCH",
    body: JSON.stringify({ days }),
  });
  if (!res.ok) throw apiError(res, "Failed to extend subscription.");
  return res.data;
};

const platformService = {
  getPlatformDashboard,
  getPlatformUsage,
  getPlatformAuditLogs,
  getPlatformUsers,
  getPlatformOrganizations,
  getPlatformOrganizationById,
  suspendPlatformOrganization,
  activatePlatformOrganization,
  getPlatformPlans,
  createPlatformPlan,
  updatePlatformPlan,
  updatePlatformPlanStatus,
  getPlatformSubscriptions,
  getPlatformSubscriptionById,
  updatePlatformSubscription,
  activatePlatformSubscription,
  suspendPlatformSubscription,
  extendPlatformSubscription,
};

export default platformService;
