/**
 * Attendance & Session API Service
 *
 * Provides functions to interact with attendance and session endpoints.
 * Reuses the central API configuration and standard authorization headers.
 */

import { apiFetch } from "../config/api";

/**
 * Fetch today's attendance record for the authenticated user.
 * @returns {Promise<{ success: boolean, data: object|null, message?: string }>}
 */
export const fetchTodayAttendance = async () => {
  const result = await apiFetch("/attendance/today", { method: "GET" });
  if (!result.ok) {
    throw new Error(result.data?.message || "Failed to load today's attendance record.");
  }
  return result.data;
};

/**
 * Punch In for today with verified browser coordinates.
 * @param {{ latitude: number, longitude: number }} coords
 * @returns {Promise<{ success: boolean, data: object, message?: string }>}
 */
export const punchInUser = async ({ latitude, longitude }) => {
  const result = await apiFetch("/attendance/punch-in", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!result.ok) {
    throw new Error(result.data?.message || "Punch In request failed.");
  }
  return result.data;
};

/**
 * Punch Out for today.
 * @returns {Promise<{ success: boolean, data: object, message?: string }>}
 */
export const punchOutUser = async () => {
  const result = await apiFetch("/attendance/punch-out", {
    method: "POST",
  });

  if (!result.ok) {
    throw new Error(result.data?.message || "Punch Out request failed.");
  }
  return result.data;
};

/**
 * End the current user session (application logout only).
 * Does not alter attendance data.
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export const logoutUser = async () => {
  try {
    const result = await apiFetch("/user/logout", { method: "POST" });
    return result.data;
  } catch (error) {
    console.warn("Logout endpoint notice:", error.message);
    return { success: false, message: error.message };
  }
};
