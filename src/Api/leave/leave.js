/**
 * Leave Module API Client
 *
 * Dedicated API request layer for the Leave Management module.
 * Reuses central apiFetch and authorization header configuration.
 */

import { apiFetch, apiError } from "../../config/api";

/**
 * Submit a new leave application.
 * @param {{ leaveTypeId: string, startDate: string, endDate: string, isHalfDay?: boolean, halfDayPeriod?: string, reason: string }} leaveData
 */
export const applyLeaveApi = async (leaveData) => {
  const result = await apiFetch("/leave/apply", {
    method: "POST",
    body: JSON.stringify(leaveData),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to submit leave application.");
  }
  return result.data;
};

/**
 * Preview / calculate working days, exclusions, and balance projection for a date range.
 * @param {{ leaveTypeId?: string, startDate: string, endDate: string, isHalfDay?: boolean, halfDayPeriod?: string }} data
 */
export const calculateLeaveDaysApi = async (data) => {
  const result = await apiFetch("/leave/calculate", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to calculate leave days.");
  }
  return result.data;
};

/**
 * Fetch calculated leave balance for authenticated user or target user.
 * @param {{ year?: number, month?: number, userId?: string }} [params]
 */
export const fetchLeaveBalanceApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.year) queryParams.append("year", params.year);
  if (params.month) queryParams.append("month", params.month);
  if (params.userId) queryParams.append("userId", params.userId);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/leave/balance${queryString}`, { method: "GET" });

  if (!result.ok) {
    throw apiError(result, "Failed to fetch leave balance.");
  }
  return result.data;
};

/**
 * Fetch authenticated employee's personal leave requests and history.
 */
export const fetchMyLeavesApi = async () => {
  const result = await apiFetch("/leave/my", { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch personal leave requests.");
  }
  return result.data;
};

/**
 * Fetch team leave requests (HR / Manager scope).
 */
export const fetchTeamLeavesApi = async () => {
  const result = await apiFetch("/leave/team", { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch team leave requests.");
  }
  return result.data;
};

/**
 * Fetch all company-wide leave requests (Admin / Owner scope).
 */
export const fetchAllLeavesApi = async () => {
  const result = await apiFetch("/leave/all", { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch company leave requests.");
  }
  return result.data;
};

/**
 * Fetch leave request details by ID.
 * @param {string} id
 */
export const fetchLeaveByIdApi = async (id) => {
  const result = await apiFetch(`/leave/${id}`, { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch leave application details.");
  }
  return result.data;
};

/**
 * Cancel own pending leave request.
 * @param {string} id
 */
export const cancelLeaveApi = async (id) => {
  const result = await apiFetch(`/leave/cancel/${id}`, { method: "PUT" });
  if (!result.ok) {
    throw apiError(result, "Failed to cancel leave request.");
  }
  return result.data;
};

/**
 * Approve an employee leave request.
 * @param {string} id
 */
export const approveLeaveApi = async (id) => {
  const result = await apiFetch(`/leave/approve/${id}`, { method: "PUT" });
  if (!result.ok) {
    throw apiError(result, "Failed to approve leave request.");
  }
  return result.data;
};

/**
 * Reject an employee leave request with optional reason.
 * @param {string} id
 * @param {string} [reason]
 */
export const rejectLeaveApi = async (id, reason = "") => {
  const result = await apiFetch(`/leave/reject/${id}`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
  if (!result.ok) {
    throw apiError(result, "Failed to reject leave request.");
  }
  return result.data;
};

/**
 * Fetch workflow audit history log for a leave request.
 * @param {string} id
 */
export const fetchLeaveAuditApi = async (id) => {
  const result = await apiFetch(`/leave/audit/${id}`, { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch leave audit log.");
  }
  return result.data;
};

/**
 * ── Leave Types Master APIs ──
 */
export const fetchLeaveTypesApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.includeInactive) queryParams.append("includeInactive", params.includeInactive);
  if (params.activeOnly) queryParams.append("activeOnly", params.activeOnly);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/leave-types${queryString}`, { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch leave types.");
  }
  return result.data;
};

export const createLeaveTypeApi = async (data) => {
  const result = await apiFetch("/leave-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!result.ok) {
    throw apiError(result, "Failed to create leave type.");
  }
  return result.data;
};

export const updateLeaveTypeApi = async (id, data) => {
  const result = await apiFetch(`/leave-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!result.ok) {
    throw apiError(result, "Failed to update leave type.");
  }
  return result.data;
};

export const deleteLeaveTypeApi = async (id) => {
  const result = await apiFetch(`/leave-types/${id}`, { method: "DELETE" });
  if (!result.ok) {
    throw apiError(result, "Failed to delete leave type.");
  }
  return result.data;
};

/**
 * ── Leave Policies Master APIs ──
 */
export const fetchLeavePoliciesApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.leaveTypeId) queryParams.append("leaveTypeId", params.leaveTypeId);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/leave-policies${queryString}`, { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch leave policies.");
  }
  return result.data;
};

export const createOrUpdateLeavePolicyApi = async (data) => {
  const result = await apiFetch("/leave-policies", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!result.ok) {
    throw apiError(result, "Failed to save leave policy.");
  }
  return result.data;
};

export const deleteLeavePolicyApi = async (id) => {
  const result = await apiFetch(`/leave-policies/${id}`, { method: "DELETE" });
  if (!result.ok) {
    throw apiError(result, "Failed to delete leave policy.");
  }
  return result.data;
};

/**
 * ── Employee Effective Policy Resolution API ──
 */
export const fetchEffectiveLeavePoliciesApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.userId) queryParams.append("userId", params.userId);
  if (params.leaveTypeId) queryParams.append("leaveTypeId", params.leaveTypeId);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/leave/policy/effective${queryString}`, { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to fetch effective leave policies.");
  }
  return result.data;
};
