import { apiFetch, apiError } from "../../config/api";

/**
 * 1. Create Family / Emergency Contact Record
 * Interacts with POST /family/create (router.post("/create", createFamily))
 * @param {Object} payload - { userId, employeeId, name, relationship, phone, email, occupation, isEmergencyContact, familyMembers }
 */
export const createFamilyApi = async (payload) => {
  const endpoints = [
    `/family/create`,
    `/family/createFamily`,
    `/family/add`,
    `/family`,
  ];

  let lastError = null;
  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return res.data.data || res.data.family || res.data;
      }
      lastError = apiError(res, `Failed with status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to create family record.");
};

/**
 * 2. Get Family details by User ID / Employee ID
 * @param {string} userId
 */
export const getFamilyByUserId = async (userId) => {
  if (!userId) return null;
  const endpoints = [
    `/family/getFamilyByUserId/${userId}`,
    `/family/user/${userId}`,
    `/family/getByUser/${userId}`,
    `/family/employee/${userId}`,
    `/family/${userId}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, { method: "GET" });
      if (res.ok && res.data) {
        const payload = res.data.data || res.data.family || res.data;
        if (payload) return payload;
      }
    } catch (e) {
      // try next
    }
  }
  return null;
};

/**
 * 3. Get All Family records (Admin / HR)
 */
export const getAllFamilies = async () => {
  const endpoints = [
    `/family/all`,
    `/family/getAllFamilies`,
    `/family`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, { method: "GET" });
      if (res.ok && res.data) {
        return res.data.data || res.data.families || res.data || [];
      }
    } catch (e) {
      // try next
    }
  }
  return [];
};

/**
 * 4. Update Family Record
 * @param {string} id - Record ID or userId
 * @param {Object} payload
 */
export const updateFamilyApi = async (id, payload) => {
  if (!id) throw new Error("Family ID / User ID is required for update");
  const endpoints = [
    `/family/update/${id}`,
    `/family/updateFamily/${id}`,
    `/family/${id}`,
  ];

  let lastError = null;
  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return res.data.data || res.data.family || res.data;
      }
      lastError = apiError(res, `Failed with status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to update family record.");
};

/**
 * 5. Delete Family Record
 * @param {string} id
 */
export const deleteFamilyApi = async (id) => {
  if (!id) throw new Error("Family ID is required for deletion");
  const res = await apiFetch(`/family/delete/${id}`, { method: "DELETE" });
  if (res.ok) return res.data;
  // Mirror the previous transport: only a transport-level failure falls
  // through to the alternate route; HTTP errors surface immediately.
  if (res.status !== 0) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  const fallback = await apiFetch(`/family/${id}`, { method: "DELETE" });
  if (!fallback.ok) {
    throw apiError(fallback, `Request failed with status ${fallback.status}`);
  }
  return fallback.data;
};
