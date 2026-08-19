/**
 * Asset Management API Service
 *
 * Provides functions to interact with Asset endpoints.
 * Reuses central API configuration and standard authorization headers.
 */

import { apiFetch } from "../config/api";

/**
 * Fetch assets list with optional pagination and filtering
 * @param {Object} [params] - Query parameters (page, limit, sortBy, sortOrder, status, category, employeeId)
 * @returns {Promise<{ success: boolean, data: Array, pagination: Object }>}
 */
export const getAssets = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const path = `/asset/all${queryString ? `?${queryString}` : ""}`;

  const res = await apiFetch(path, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load assets.");
  }
  return res.data;
};

/**
 * Create a new asset in inventory
 * @param {Object} assetData - { name, category, serialNumber, modelName, manufacturer, purchaseDate, warrantyExpiryDate }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createAsset = async (assetData) => {
  const res = await apiFetch("/asset/create", {
    method: "POST",
    body: JSON.stringify(assetData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to create asset.");
  }
  return res.data;
};

/**
 * Assign an available asset to an employee
 * @param {Object} assetData - { assetId, employeeId, conditionOnAssign, remarks }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const assignAsset = async (assetData) => {
  const res = await apiFetch("/asset/assign", {
    method: "POST",
    body: JSON.stringify(assetData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to assign asset.");
  }
  return res.data;
};

/**
 * Return an assigned asset back to inventory
 * @param {string} assetId - ID of the asset being returned
 * @param {Object} [returnData] - { conditionOnReturn, remarks }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const returnAsset = async (assetId, returnData = {}) => {
  const res = await apiFetch(`/asset/${assetId}/return`, {
    method: "PUT",
    body: JSON.stringify(returnData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to return asset.");
  }
  return res.data;
};

const assetService = {
  getAssets,
  createAsset,
  assignAsset,
  returnAsset,
};

export default assetService;
