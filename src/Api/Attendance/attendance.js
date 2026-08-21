/**
 * Attendance Module API Client
 *
 * Dedicated API request layer for the Attendance module.
 * Reuses central apiFetch and authorization header configuration.
 */

import { apiFetch } from "../../config/api";

/**
 * Fetch today's attendance record for the authenticated user.
 */
export const fetchTodayAttendance = async () => {
  const result = await apiFetch("/attendance/today", { method: "GET" });
  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to load today's attendance record.");
  }
  return result.data;
};

/**
 * Punch In for today with verified coordinates.
 * @param {{ latitude: number, longitude: number, accuracy?: number }} coords
 */
export const punchInUser = async ({ latitude, longitude, accuracy = 0 }) => {
  const result = await apiFetch("/attendance/punch-in", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude, accuracy }),
  });

  if (!result.ok) {
    throw new Error(result.data?.message || "Punch In request failed.");
  }
  return result.data;
};

/**
 * Punch Out for today with optional coordinates.
 * @param {{ latitude?: number, longitude?: number, accuracy?: number }} [coords]
 */
export const punchOutUser = async (coords = {}) => {
  const result = await apiFetch("/attendance/punch-out", {
    method: "POST",
    body: JSON.stringify(coords),
  });

  if (!result.ok) {
    throw new Error(result.data?.message || "Punch Out request failed.");
  }
  return result.data;
};

/**
 * Fetch authenticated employee's own attendance history.
 * Secure: derives user identity from server JWT token.
 */
export const fetchMyAttendance = async () => {
  const result = await apiFetch("/attendance/my", { method: "GET" });
  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to fetch attendance history.");
  }
  return result.data;
};

/**
 * Fetch monthly attendance grid for authenticated user or target employee.
 */
export const fetchAttendanceByMonth = async (month, year, targetUserId = "") => {
  const query = targetUserId ? `?userId=${targetUserId}` : "";
  const result = await apiFetch(`/attendance/month/${month}/${year}${query}`, { method: "GET" });
  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to fetch monthly attendance.");
  }
  return result.data;
};

/**
 * Fetch team / all employee attendance records with search, date range, status, pagination.
 * @param {{ search?: string, date?: string, startDate?: string, endDate?: string, status?: string, page?: number, limit?: number }} params
 */
export const fetchTeamAttendance = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.date) queryParams.append("date", params.date);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.status) queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/attendance/team${queryString}`, { method: "GET" });

  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to fetch team attendance records.");
  }
  return result.data;
};

/**
 * Fetch Attendance Analytics overview metrics (Admin / Owner).
 */
export const fetchAttendanceAnalytics = async () => {
  const result = await apiFetch("/attendance/analytics", { method: "GET" });
  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to load attendance analytics.");
  }
  return result.data;
};

/**
 * Update / correct an attendance record with mandatory audit reason.
 * @param {string} id
 * @param {{ loginTime?: string, logoutTime?: string, status?: string, locationType?: string, isLate?: boolean, reason: string }} updateData
 */
export const updateAttendanceCorrection = async (id, updateData) => {
  const result = await apiFetch(`/attendance/correction/${id}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });

  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to correct attendance record.");
  }
  return result.data;
};

/**
 * Fetch team attendance overview for today (HR / Admin / Owner).
 * Returns present/absent/late/working counts and needs-attention lists.
 */
export const fetchTeamAttendanceToday = async () => {
  const result = await apiFetch("/attendance/team/today", { method: "GET" });
  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to load team attendance overview.");
  }
  return result.data;
};

