import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Offboarding API Service
 */

export const initiateOffboarding = async (payload) => {
  const res = await apiFetch("/offboarding/initiate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to initiate offboarding.");
  return res.data;
};

export const updateDepartmentClearance = async (offboardingId, payload) => {
  const res = await apiFetch(`/offboarding/${offboardingId}/clearance`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to update clearance status.");
  return res.data;
};

export const completeOffboarding = async (id, remarks = "") => {
  const res = await apiFetch(`/offboarding/${id}/complete`, {
    method: "PUT",
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) throw apiError(res, "Failed to complete offboarding.");
  return res.data;
};

export const getAllOffboardings = async (params = {}) => {
  const res = await apiFetch(`/offboarding/all${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch offboardings.");
  return res.data;
};

const offboardingService = {
  initiateOffboarding,
  updateDepartmentClearance,
  completeOffboarding,
  getAllOffboardings,
};

export default offboardingService;
