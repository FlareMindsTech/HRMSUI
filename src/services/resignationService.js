import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Resignation API Service
 */

export const submitResignation = async (payload) => {
  const res = await apiFetch("/resignation/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to submit resignation.");
  return res.data;
};

export const withdrawResignation = async (id, reason = "") => {
  const res = await apiFetch(`/resignation/withdraw/${id}`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw apiError(res, "Failed to withdraw resignation.");
  return res.data;
};

export const getAllResignations = async (params = {}) => {
  const res = await apiFetch(`/resignation/all${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch resignations.");
  return res.data;
};

export const updateExitDetails = async (id, payload) => {
  const res = await apiFetch(`/resignation/exit-details/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to update exit details.");
  return res.data;
};

const resignationService = {
  submitResignation,
  withdrawResignation,
  getAllResignations,
  updateExitDetails,
};

export default resignationService;
