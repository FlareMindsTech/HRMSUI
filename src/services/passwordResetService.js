import { apiFetch, apiError } from "../config/api";

/**
 * Password Reset & Reset Rules Service
 */

export const requestPasswordReset = async (email) => {
  const res = await apiFetch("/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw apiError(res, "Failed to submit password reset request.");
  return res.data;
};

export const resetPassword = async (payload) => {
  const res = await apiFetch("/password-reset/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to reset password.");
  return res.data;
};

export const getPendingPasswordResetApprovals = async () => {
  const res = await apiFetch("/password-reset/pending-approvals", {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to load pending password reset requests.");
  return res.data;
};

export const approveOrRejectPasswordReset = async (id, action, reason = "") => {
  const res = await apiFetch(`/password-reset/approve-reject/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action, reason }),
  });
  if (!res.ok) throw apiError(res, `Failed to ${action} password reset request.`);
  return res.data;
};

export const getAllPasswordResetRules = async () => {
  const res = await apiFetch("/password-reset-rule/", {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch password reset rules.");
  return res.data;
};

export const createOrUpdatePasswordResetRule = async (payload) => {
  const res = await apiFetch("/password-reset-rule/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to save password reset rule.");
  return res.data;
};

export const deletePasswordResetRule = async (id) => {
  const res = await apiFetch(`/password-reset-rule/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw apiError(res, "Failed to delete password reset rule.");
  return res.data;
};

const passwordResetService = {
  requestPasswordReset,
  resetPassword,
  getPendingPasswordResetApprovals,
  approveOrRejectPasswordReset,
  getAllPasswordResetRules,
  createOrUpdatePasswordResetRule,
  deletePasswordResetRule,
};

export default passwordResetService;
