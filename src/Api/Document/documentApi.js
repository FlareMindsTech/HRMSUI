import { apiFetch, apiError, buildQuery } from "../../config/api";

// 1. Get Document by User ID
export const getDocumentByUserId = async (userId) => {
  if (!userId) return null;
  const res =
    (await apiFetch(`/document/user/${userId}`, { method: "GET" }).catch(() => null)) ||
    (await apiFetch(`/document/${userId}`, { method: "GET" }));
  if (!res || !res.ok) {
    return null;
  }
  return res.data?.data || res.data?.document || res.data;
};

// 2. Get All Documents (HR/Admin)
export const getAllDocuments = async (params = {}) => {
  const qs = buildQuery(params);
  const res =
    (await apiFetch(`/document/all${qs}`, { method: "GET" }).catch(() => null)) ||
    (await apiFetch(`/document${qs}`, { method: "GET" }));
  if (!res || !res.ok) {
    throw apiError(res, "Failed to fetch all documents");
  }
  return res.data?.data || res.data?.documents || res.data || [];
};

// 3. Create Document Record
export const createDocumentApi = async (payload) => {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const res =
    (await apiFetch(`/document/create`, {
      method: "POST",
      body: isFormData ? payload : JSON.stringify(payload),
    }).catch(() => null)) ||
    (await apiFetch(`/document`, {
      method: "POST",
      body: isFormData ? payload : JSON.stringify(payload),
    }));
  if (!res || !res.ok) {
    throw apiError(res, "Failed to create document record");
  }
  return res.data?.data || res.data?.document || res.data;
};

// 4. Update Document Record by User ID
export const updateDocumentApi = async (userId, payload) => {
  if (!userId) throw new Error("User ID is required for update");
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const res =
    (await apiFetch(`/document/update/${userId}`, {
      method: "PUT",
      body: isFormData ? payload : JSON.stringify(payload),
    }).catch(() => null)) ||
    (await apiFetch(`/document/${userId}`, {
      method: "PUT",
      body: isFormData ? payload : JSON.stringify(payload),
    }));
  if (!res || !res.ok) {
    throw apiError(res, "Failed to update document record");
  }
  return res.data?.data || res.data?.document || res.data;
};

// 5. Delete Document Record by User ID
export const deleteDocumentApi = async (userId) => {
  if (!userId) throw new Error("User ID is required for deletion");
  const res =
    (await apiFetch(`/document/delete/${userId}`, { method: "DELETE" }).catch(() => null)) ||
    (await apiFetch(`/document/${userId}`, { method: "DELETE" }));
  if (!res || !res.ok) {
    throw apiError(res, "Failed to delete document record");
  }
  return res.data;
};

/**
 * 6. Upload single file directly to Cloudinary via DocumentSystem API
 * @param {Object} params
 * @param {File|Blob} params.file - File object to upload
 * @param {string} [params.entityType='User']
 * @param {string} params.entityId - Employee ID / User ID
 * @param {string} [params.documentType='OTHER']
 * @param {string} [params.category='GENERAL']
 * @param {string} [params.title]
 */
export const uploadDocumentFile = async ({
  file,
  entityType = "User",
  entityId,
  documentType = "OTHER",
  category = "GENERAL",
  title,
}) => {
  if (!file) throw new Error("File is required for upload.");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entityType", entityType);
  if (entityId) formData.append("entityId", entityId);
  formData.append("documentType", documentType);
  formData.append("category", category);
  if (title) formData.append("title", title);

  const res = await apiFetch("/v1/documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw apiError(res, "Failed to upload document file.");
  }
  return res.data?.data || res.data;
};

/**
 * 7. Fetch all portfolio documents for an employee
 * @param {string} employeeId - Employee / User ID
 */
export const getEmployeeDocuments = async (employeeId) => {
  if (!employeeId) return [];
  const res = await apiFetch(`/v1/documents/employee/${employeeId}`, { method: "GET" });
  if (res && res.ok) {
    return res.data?.data || res.data?.documents || res.data || [];
  }
  return [];
};
