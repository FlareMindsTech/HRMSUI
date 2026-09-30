import { apiFetch, apiError } from "../../config/api";

// 1. Get Document by User ID
export const getDocumentByUserId = async (userId) => {
  if (!userId) return null;
  const res = await apiFetch(`/document/user/${userId}`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};

// 2. Get All Documents (HR/Admin)
export const getAllDocuments = async () => {
  const res = await apiFetch(`/document/all`, { method: "GET" });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};

// 3. Create Document Record
export const createDocumentApi = async (payload) => {
  const res = await apiFetch(`/document/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};

// 4. Update Document Record by User ID
export const updateDocumentApi = async (userId, payload) => {
  if (!userId) throw new Error("User ID is required for update");
  const res = await apiFetch(`/document/update/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};

// 5. Delete Document Record by User ID
export const deleteDocumentApi = async (userId) => {
  if (!userId) throw new Error("User ID is required for deletion");
  const res = await apiFetch(`/document/delete/${userId}`, { method: "DELETE" });
  if (!res.ok) {
    throw apiError(res, `Request failed with status ${res.status}`);
  }
  return res.data;
};
