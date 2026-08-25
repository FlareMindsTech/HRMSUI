import { API_BASE_URL, authHeaders } from "../../config/api";

// Helper to normalize response
const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

// 1. Add / Create Experience (Multipart FormData or JSON)
export const addExperienceApi = async (formDataOrObj) => {
  const isFormData = formDataOrObj instanceof FormData;
  const headers = authHeaders();
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_BASE_URL}/experience/add`, {
    method: "POST",
    headers,
    body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj),
  });

  return handleResponse(res);
};

// 2. Get Experiences by User ID
export const getExperienceByUserId = async (userId) => {
  if (!userId) return [];
  try {
    const endpoints = [
      `${API_BASE_URL}/experience/get/${userId}`,
      `${API_BASE_URL}/experience/user/${userId}`,
      `${API_BASE_URL}/experience/${userId}`,
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { method: "GET", headers: authHeaders() });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const list = data?.data || data?.experiences || data?.experience || data || [];
          if (Array.isArray(list)) return list;
          if (list && typeof list === "object" && Object.keys(list).length > 0) return [list];
        }
      } catch (e) {
        // try next
      }
    }
  } catch (err) {
    console.warn("getExperienceByUserId error:", err.message);
  }
  return [];
};

// 3. Get Experience by ID
export const getExperienceById = async (id) => {
  if (!id) return null;
  const res = await fetch(`${API_BASE_URL}/experience/${id}`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await handleResponse(res);
  return data?.data || data;
};

// 4. Update Experience
export const updateExperienceApi = async (id, formDataOrObj) => {
  if (!id) throw new Error("Experience ID is required for update");
  const isFormData = formDataOrObj instanceof FormData;
  const headers = authHeaders();
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_BASE_URL}/experience/update/${id}`, {
    method: "PUT",
    headers,
    body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj),
  });

  return handleResponse(res);
};

// 5. Delete Experience
export const deleteExperienceApi = async (id) => {
  if (!id) throw new Error("Experience ID is required for deletion");
  const res = await fetch(`${API_BASE_URL}/experience/delete/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return handleResponse(res);
};
