import { API_BASE_URL, authHeaders } from "../../config/api";

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

// 1. Get Document by User ID
export const getDocumentByUserId = async (userId) => {
  if (!userId) return null;
  const res = await fetch(`${API_BASE_URL}/document/user/${userId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// 2. Get All Documents (HR/Admin)
export const getAllDocuments = async () => {
  const res = await fetch(`${API_BASE_URL}/document/all`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// 3. Create Document Record
export const createDocumentApi = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/document/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// 4. Update Document Record by User ID
export const updateDocumentApi = async (userId, payload) => {
  if (!userId) throw new Error("User ID is required for update");
  const res = await fetch(`${API_BASE_URL}/document/update/${userId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// 5. Delete Document Record by User ID
export const deleteDocumentApi = async (userId) => {
  if (!userId) throw new Error("User ID is required for deletion");
  const res = await fetch(`${API_BASE_URL}/document/delete/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};
