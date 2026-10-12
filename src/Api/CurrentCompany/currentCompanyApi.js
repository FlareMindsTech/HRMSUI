import { apiFetch, apiError, buildQuery } from "../../config/api";

/**
 * Fetch Current Company details by User ID
 * @param {string} userId - User / Employee ID
 */
export const getCurrentCompanyByUserId = async (userId) => {
  if (!userId) return null;
  try {
    const endpoints = [
      `/currentcompany/${userId}`,
      `/currentcompany/user/${userId}`,
    ];

    for (const ep of endpoints) {
      try {
        const res = await apiFetch(ep, { method: "GET" });
        if (res.ok && res.data) {
          const payload = res.data.data || res.data.currentCompany || res.data;
          if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
            return payload;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }
  } catch (error) {
    console.warn("getCurrentCompanyByUserId notice:", error.message);
  }
  return null;
};

/**
 * Fetch all Current Company records (Admin/HR)
 * @param {Object} [params]
 */
export const getAllCurrentCompanies = async (params = {}) => {
  const qs = buildQuery(params);
  const res =
    (await apiFetch(`/currentcompany/all${qs}`, { method: "GET" }).catch(() => null)) ||
    (await apiFetch(`/currentcompany${qs}`, { method: "GET" }));
  if (res && res.ok) {
    return res.data?.data || res.data?.companies || res.data || [];
  }
  return [];
};

/**
 * Fetch supported Employment Types
 */
export const getEmploymentTypes = async () => {
  const res = await apiFetch(`/currentcompany/employment-types`, { method: "GET" });
  if (res && res.ok) {
    return res.data?.data || res.data || [];
  }
  return [];
};

/**
 * Create Current Company Record
 * Supports both FormData (with file uploads to Cloudinary) and JSON
 * @param {FormData|Object} payload
 */
export const createCurrentCompany = async (payload) => {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;

  const endpoints = [`/currentcompany`, `/currentcompany/create`];

  let lastError = null;
  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, {
        method: "POST",
        body: isFormData ? payload : JSON.stringify(payload),
      });
      if (res.ok) {
        return res.data?.data || res.data?.currentCompany || res.data;
      }
      lastError = apiError(res, `Failed with status ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("Failed to create current company record.");
};

/**
 * Update Current Company Record by User ID
 * Supports both FormData (with file uploads to Cloudinary) and JSON
 * @param {string} userId - User ID
 * @param {FormData|Object} payload
 */
export const updateCurrentCompany = async (userId, payload) => {
  if (!userId) throw new Error("User ID is required for update.");
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;

  const endpoints = [
    `/currentcompany/${userId}`,
    `/currentcompany/update/${userId}`,
  ];

  let lastError = null;
  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, {
        method: "PUT",
        body: isFormData ? payload : JSON.stringify(payload),
      });
      if (res.ok) {
        return res.data?.data || res.data?.currentCompany || res.data;
      }
      lastError = apiError(res, `Failed with status ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }

  // If update failed because record does not exist yet, fallback to createCurrentCompany
  try {
    if (isFormData) {
      if (!payload.has("userId")) payload.append("userId", userId);
    } else {
      payload.userId = userId;
    }
    return await createCurrentCompany(payload);
  } catch (createErr) {
    throw lastError || createErr;
  }
};

/**
 * Delete Current Company Record by User ID
 * @param {string} userId - User ID
 */
export const deleteCurrentCompany = async (userId) => {
  if (!userId) throw new Error("User ID is required for deletion.");
  const res =
    (await apiFetch(`/currentcompany/delete/${userId}`, { method: "DELETE" }).catch(() => null)) ||
    (await apiFetch(`/currentcompany/${userId}`, { method: "DELETE" }));

  if (!res || !res.ok) {
    throw apiError(res, "Failed to delete current company record.");
  }
  return res.data;
};
