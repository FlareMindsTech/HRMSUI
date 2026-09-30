import { apiFetch, apiError } from "../../config/api";

// 1. Add / Create Experience (Multipart FormData or JSON)
export const addExperienceApi = async (formDataOrObj) => {
  const isFormData =
    typeof FormData !== "undefined" && formDataOrObj instanceof FormData;

  const res = await apiFetch(`/experience/add`, {
    method: "POST",
    body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj),
  });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};

// 2. Get Experiences by User ID
export const getExperienceByUserId = async (userId) => {
  if (!userId) return [];
  try {
    const endpoints = [
      `/experience/get/${userId}`,
      `/experience/user/${userId}`,
      `/experience/${userId}`,
    ];
    for (const ep of endpoints) {
      try {
        const res = await apiFetch(ep, { method: "GET" });
        if (res.ok) {
          const data = res.data;
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
  const res = await apiFetch(`/experience/${id}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data?.data || res.data;
};

// 4. Update Experience
export const updateExperienceApi = async (id, formDataOrObj) => {
  if (!id) throw new Error("Experience ID is required for update");
  const isFormData =
    typeof FormData !== "undefined" && formDataOrObj instanceof FormData;

  const res = await apiFetch(`/experience/update/${id}`, {
    method: "PUT",
    body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj),
  });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};

// 5. Delete Experience
export const deleteExperienceApi = async (id) => {
  if (!id) throw new Error("Experience ID is required for deletion");
  const res = await apiFetch(`/experience/delete/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};
