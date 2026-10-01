import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Reimbursement API Service
 */

export const submitReimbursement = async (payload) => {
  const res = await apiFetch("/reimbursement/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to submit reimbursement claim.");
  return res.data;
};

export const getReimbursements = async (params = {}) => {
  const res = await apiFetch(`/reimbursement/all${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to load reimbursement claims.");
  return res.data;
};

export const markReimbursementPaid = async (id, payload) => {
  const res = await apiFetch(`/reimbursement/${id}/pay`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to mark reimbursement as paid.");
  return res.data;
};

const reimbursementService = {
  submitReimbursement,
  getReimbursements,
  markReimbursementPaid,
};

export default reimbursementService;
