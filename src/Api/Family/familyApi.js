import { apiFetch, API_BASE_URL, authHeaders } from "../../config/api";

// Helper to normalize and handle response
const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

/**
 * 1. Create Family / Emergency Contact Record
 * Interacts with POST /family/create (router.post("/create", createFamily))
 * @param {Object} payload - { userId, employeeId, name, relationship, phone, email, occupation, isEmergencyContact, familyMembers }
 */
export const createFamilyApi = async (payload) => {
  const endpoints = [
    `${API_BASE_URL}/family/create`,
    `${API_BASE_URL}/family/createFamily`,
    `${API_BASE_URL}/family/add`,
    `${API_BASE_URL}/family`,
  ];

  let lastError = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data.data || data.family || data;
      }
      lastError = new Error(data?.message || `Failed with status ${res.status}`);
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
    `${API_BASE_URL}/family/update/${id}`,
    `${API_BASE_URL}/family/updateFamily/${id}`,
    `${API_BASE_URL}/family/${id}`,
  ];

  let lastError = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data.data || data.family || data;
      }
      lastError = new Error(data?.message || `Failed with status ${res.status}`);
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
  const res = await fetch(`${API_BASE_URL}/family/delete/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).catch(() => null)
    || await fetch(`${API_BASE_URL}/family/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

  return handleResponse(res);
};
