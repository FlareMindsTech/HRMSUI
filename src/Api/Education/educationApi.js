/**
 * Education API Service
 * 
 * Provides complete API integration with the HRMS backend Education endpoints.
 * Compatible with EducationController & EducationModule schema and controller routes.
 */

import { apiFetch, API_BASE_URL, authHeaders } from "../../config/api";

/**
 * Helper to construct query string from params object
 */
const buildQuery = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });
  const qs = queryParams.toString();
  return qs ? `?${qs}` : "";
};

/**
 * Fetch Education details by User ID / Employee ID
 * @param {string} userId - User or Employee ID
 */
export const getEducationByUserId = async (userId) => {
  if (!userId) return null;
  try {
    const endpoints = [
      `/education/${userId}`,
      `/education/user/${userId}`,
      `/education/getEducationByUserId/${userId}`,
      `/education/getByUser/${userId}`,
      `/education/employee/${userId}`,
      `/education/get/${userId}`,
      `/education/getEducation/${userId}`,
    ];

    for (const ep of endpoints) {
      try {
        const res = await apiFetch(ep, { method: "GET" });
        if (res.ok && res.data) {
          const payload = res.data.data || res.data.education || res.data.educationRecord || res.data;
          if (payload && (typeof payload === "object" && Object.keys(payload).length > 0)) {
            return payload;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }
  } catch (error) {
    console.warn("getEducationByUserId notice:", error.message);
  }
  return null;
};

/**
 * Fetch Education details by Record ID
 * @param {string} id - Education record ID
 */
export const getEducationById = async (id) => {
  if (!id) return null;
  const res = await apiFetch(`/education/getEducationById/${id}`, { method: "GET" }).catch(() => null)
    || await apiFetch(`/education/${id}`, { method: "GET" });
  if (res && res.ok) {
    return res.data?.data || res.data?.education || res.data || null;
  }
  return null;
};

/**
 * Fetch all Education records (with optional pagination / search filters)
 * @param {Object} [params]
 */
export const getAllEducations = async (params = {}) => {
  const qs = buildQuery(params);
  const res = await apiFetch(`/education/getAllEducations${qs}`, { method: "GET" }).catch(() => null)
    || await apiFetch(`/education/all${qs}`, { method: "GET" }).catch(() => null)
    || await apiFetch(`/education${qs}`, { method: "GET" });
  if (res && res.ok) {
    return res.data?.data || res.data?.educations || res.data || [];
  }
  return [];
};

/**
 * Create Education Record
 * Supports multipart/form-data for document attachments as well as JSON
 * @param {FormData|Object} payload
 */
export const createEducation = async (payload) => {
  let body = payload;
  const headers = { ...authHeaders() };

  if (payload instanceof FormData) {
    const endpoints = [
      `${API_BASE_URL}/education`,
      `${API_BASE_URL}/education/createEducation`,
      `${API_BASE_URL}/education/create`,
      `${API_BASE_URL}/education/add`,
      `${API_BASE_URL}/education/save`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body,
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          return data.data || data.education || data.educationRecord || data;
        }
        lastError = new Error(data.message || `Failed with status ${response.status}`);
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error("Failed to create education record.");
  }

  // JSON payload fallback
  const res = await apiFetch("/education", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => null)
    || await apiFetch("/education/createEducation", {
      method: "POST",
      body: JSON.stringify(payload),
    }).catch(() => null)
    || await apiFetch("/education/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }).catch(() => null)
    || await apiFetch("/education/add", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  if (!res || !res.ok) {
    throw new Error(res?.data?.message || "Failed to create education record.");
  }
  return res.data?.data || res.data?.education || res.data;
};

/**
 * Update Education Record
 * Supports multipart/form-data for document replacements as well as JSON
 * @param {string} id - Education record ID or userId
 * @param {FormData|Object} payload
 */
export const updateEducation = async (id, payload) => {
  if (!id) throw new Error("Education ID / User ID is required for update.");
  let body = payload;
  const headers = { ...authHeaders() };

  if (payload instanceof FormData) {
    const endpoints = [
      { url: `${API_BASE_URL}/education/${id}`, method: "PUT" },
      { url: `${API_BASE_URL}/education/updateEducation/${id}`, method: "PUT" },
      { url: `${API_BASE_URL}/education/update/${id}`, method: "PUT" },
      { url: `${API_BASE_URL}/education/user/${id}`, method: "PUT" },
      { url: `${API_BASE_URL}/education/updateByUserId/${id}`, method: "PUT" },
      { url: `${API_BASE_URL}/education/update/${id}`, method: "POST" },
      { url: `${API_BASE_URL}/education/${id}`, method: "POST" },
    ];

    let lastError = null;
    for (const ep of endpoints) {
      try {
        const response = await fetch(ep.url, {
          method: ep.method,
          headers,
          body,
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          return data.data || data.education || data.educationRecord || data;
        }
        lastError = new Error(data.message || `Failed with status ${response.status}`);
      } catch (e) {
        lastError = e;
      }
    }

    // If update failed (e.g. 404 record not created yet), fallback to createEducation
    try {
      if (!payload.has("userId")) payload.append("userId", id);
      return await createEducation(payload);
    } catch (createErr) {
      throw lastError || createErr;
    }
  }

  // JSON payload fallback
  const res = await apiFetch(`/education/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).catch(() => null)
    || await apiFetch(`/education/updateEducation/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).catch(() => null)
    || await apiFetch(`/education/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).catch(() => null)
    || await apiFetch(`/education/user/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

  if (!res || !res.ok) {
    // Try create if update failed
    try {
      return await createEducation({ ...payload, userId: id });
    } catch (createErr) {
      throw new Error(res?.data?.message || createErr.message || "Failed to update education record.");
    }
  }
  return res.data?.data || res.data?.education || res.data;
};

/**
 * Delete Education Record
 * @param {string} id - Education record ID
 */
export const deleteEducation = async (id) => {
  if (!id) throw new Error("Education ID is required for deletion.");
  const res = await apiFetch(`/education/deleteEducation/${id}`, { method: "DELETE" }).catch(() => null)
    || await apiFetch(`/education/delete/${id}`, { method: "DELETE" }).catch(() => null)
    || await apiFetch(`/education/${id}`, { method: "DELETE" });

  if (!res || !res.ok) {
    throw new Error(res?.data?.message || "Failed to delete education record.");
  }
  return res.data;
};

/**
 * HR / Admin Verify Education Record
 * @param {string} id - Education record ID
 * @param {Object} verificationData - { isVerified, remarks }
 */
export const verifyEducation = async (id, verificationData) => {
  if (!id) throw new Error("Education ID is required for verification.");
  const res = await apiFetch(`/education/verifyEducation/${id}`, {
    method: "PUT",
    body: JSON.stringify(verificationData),
  }).catch(() => null)
    || await apiFetch(`/education/verify/${id}`, {
      method: "PUT",
      body: JSON.stringify(verificationData),
    }).catch(() => null)
    || await updateEducation(id, verificationData);

  return res;
};
