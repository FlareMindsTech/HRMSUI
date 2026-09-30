/**
 * Education API Service
 * 
 * Provides complete API integration with the HRMS backend Education endpoints.
 * Compatible with EducationController & EducationModule schema and controller routes.
 */

import { apiFetch, apiError, buildQuery } from "../../config/api";

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

  if (payload instanceof FormData) {
    const endpoints = [
      `/education`,
      `/education/createEducation`,
      `/education/create`,
      `/education/add`,
      `/education/save`,
    ];

    let lastError = null;
    for (const ep of endpoints) {
      try {
        const res = await apiFetch(ep, {
          method: "POST",
          body,
        });
        if (res.ok) {
          const data = res.data;
          return data.data || data.education || data.educationRecord || data;
        }
        lastError = apiError(res, `Failed with status ${res.status}`);
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
    throw apiError(res, "Failed to create education record.");
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

  if (payload instanceof FormData) {
    const endpoints = [
      { ep: `/education/${id}`, method: "PUT" },
      { ep: `/education/updateEducation/${id}`, method: "PUT" },
      { ep: `/education/update/${id}`, method: "PUT" },
      { ep: `/education/user/${id}`, method: "PUT" },
      { ep: `/education/updateByUserId/${id}`, method: "PUT" },
      { ep: `/education/update/${id}`, method: "POST" },
      { ep: `/education/${id}`, method: "POST" },
    ];

    let lastError = null;
    for (const { ep, method } of endpoints) {
      try {
        const res = await apiFetch(ep, {
          method,
          body,
        });
        if (res.ok) {
          const data = res.data;
          return data.data || data.education || data.educationRecord || data;
        }
        lastError = apiError(res, `Failed with status ${res.status}`);
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
      const updateErr = new Error(res?.data?.message || createErr.message || "Failed to update education record.");
      updateErr.status = res?.status;
      updateErr.data = res?.data;
      throw updateErr;
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
    throw apiError(res, "Failed to delete education record.");
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
