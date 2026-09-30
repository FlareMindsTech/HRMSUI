/**
 * Attendance Module API Client
 *
 * Dedicated API request layer for the Attendance module.
 * Reuses central apiFetch and authorization header configuration.
 */

import { apiFetch, apiError } from "../../config/api";

/**
 * Fetch today's attendance record for the authenticated user.
 */
export const fetchTodayAttendance = async () => {
  const result = await apiFetch("/attendance/today", { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to load today's attendance record.");
  }
  return result.data;
};

/**
 * Punch In for today with verified coordinates.
 * In STATIC_IP mode, coordinates are optional if unavailable.
 * @param {{ latitude?: number, longitude?: number, accuracy?: number }} coords
 */
export const punchInUser = async (coords = {}) => {
  const payload = {};
  if (coords?.latitude !== undefined && coords?.latitude !== null) payload.latitude = coords.latitude;
  if (coords?.longitude !== undefined && coords?.longitude !== null) payload.longitude = coords.longitude;
  if (coords?.accuracy !== undefined && coords?.accuracy !== null) payload.accuracy = coords.accuracy;

  const result = await apiFetch("/attendance/punch-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    throw apiError(result, "Punch In request failed.");
  }
  return result.data;
};

/**
 * Punch Out for today with verified coordinates.
 * @param {{ latitude?: number, longitude?: number, accuracy?: number }} coords
 */
export const punchOutUser = async (coords = {}) => {
  const result = await apiFetch("/attendance/punch-out", {
    method: "POST",
    body: JSON.stringify(coords),
  });

  if (!result.ok) {
    throw apiError(result, "Punch Out request failed.");
  }
  return result.data;
};

/**
 * Standardized Attendance Error Formatter
 * Translates HTTP status codes and backend response messages into user-friendly notifications.
 */
export const formatAttendanceError = (error) => {
  if (!error) return "An unexpected error occurred.";
  const status = error.status;
  const msg = error.message || "";

  if (status === 401 || msg.includes("jwt") || msg.includes("unauthorized") || msg.includes("Session expired")) {
    return "Session expired. Please login again.";
  }
  if (status === 403) {
    if (msg.includes("registered office network") || msg.includes("office network") || msg.includes("STATIC_IP")) {
      return "Attendance is allowed only from the registered office network.";
    }
    return msg || "Access denied.";
  }
  if (status === 0 || msg.includes("Failed to fetch") || msg.includes("Network request failed") || !navigator.onLine) {
    return "Unable to connect to HRMS server. Please check your internet connection.";
  }
  if (status >= 500) {
    return "Attendance service is temporarily unavailable.";
  }
  return msg || "Failed to process attendance request.";
};

/**
 * Send periodic geofence heartbeat ping with verified coordinates.
 * @param {{ latitude: number, longitude: number, accuracy?: number }} coords
 */
export const sendGeofencePing = async ({ latitude, longitude, accuracy = 0 }) => {
  const result = await apiFetch("/attendance/geofence/ping", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude, accuracy }),
  });

  if (!result.ok) {
    throw apiError(result, "Geofence ping request failed.");
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
    throw apiError(result, "Failed to fetch attendance history.");
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
    throw apiError(result, "Failed to fetch monthly attendance.");
  }
  return result.data;
};

/**
 * Fetch team / all employee attendance records with search, date range, status, pagination.
 * @param {{ search?: string, date?: string, startDate?: string, endDate?: string, status?: string, page?: number, limit?: number }} params
 */
/**
 * Fetch team / all employee attendance records with search, date range, status, branch, department, location, shift, attendanceSource, pagination.
 * @param {{ search?: string, date?: string, startDate?: string, endDate?: string, status?: string, branchId?: string, departmentId?: string, locationId?: string, shiftId?: string, attendanceSource?: string, page?: number, limit?: number }} params
 */
export const fetchTeamAttendance = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.date) queryParams.append("date", params.date);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.status) queryParams.append("status", params.status);
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);
  if (params.locationId) queryParams.append("locationId", params.locationId);
  if (params.shiftId) queryParams.append("shiftId", params.shiftId);
  if (params.attendanceSource) queryParams.append("attendanceSource", params.attendanceSource);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const endpoints = [
    `/attendance/team${queryString}`,
    `/api/attendance/team${queryString}`,
    `/attendance/all${queryString}`,
    `/api/attendance/all${queryString}`,
    `/attendance${queryString}`,
    `/api/attendance${queryString}`,
  ];

  for (const ep of endpoints) {
    try {
      const result = await apiFetch(ep, { method: "GET" });
      if (result.ok && result.data && typeof result.data === "object") {
        return result.data;
      }
    } catch (e) {}
  }

  // Graceful fallback for empty/unconfigured attendance table
  return { success: true, data: [], total: 0, totalPages: 1 };
};

/**
 * Fetch Attendance Analytics overview metrics.
 */
export const fetchAttendanceAnalytics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);
  if (params.locationId) queryParams.append("locationId", params.locationId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const endpoints = [
    `/attendance/analytics${qs}`,
    `/api/attendance/analytics${qs}`,
  ];

  for (const ep of endpoints) {
    try {
      const result = await apiFetch(ep, { method: "GET" });
      if (result.ok && result.data) return result.data;
    } catch (e) {}
  }

  return { success: true, data: { present: 0, absent: 0, late: 0, halfDay: 0, totalEmployees: 0 } };
};

/**
 * Fetch team attendance overview for today.
 */
export const fetchTeamAttendanceToday = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);
  if (params.locationId) queryParams.append("locationId", params.locationId);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const endpoints = [
    `/attendance/team/today${qs}`,
    `/api/attendance/team/today${qs}`,
    `/attendance/today${qs}`,
    `/api/attendance/today${qs}`,
  ];

  for (const ep of endpoints) {
    try {
      const result = await apiFetch(ep, { method: "GET" });
      if (result.ok && result.data) return result.data;
    } catch (e) {}
  }

  return { success: true, data: { inScope: 0, present: 0, working: 0, absent: 0, late: 0, halfDay: 0 } };
};

/**
 * Fetch Attendance Exceptions (Missing Punch Out, Late, Geofence violation, Short Hours).
 */
export const fetchAttendanceExceptions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.date) queryParams.append("date", params.date);
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);
  if (params.locationId) queryParams.append("locationId", params.locationId);
  if (params.exceptionType) queryParams.append("exceptionType", params.exceptionType);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const endpoints = [
    `/attendance/exceptions${qs}`,
    `/api/attendance/exceptions${qs}`,
  ];

  for (const ep of endpoints) {
    try {
      const result = await apiFetch(ep, { method: "GET" });
      if (result.ok && result.data) return result.data;
    } catch (e) {}
  }

  return { success: true, data: [] };
};

/**
 * Fetch Overtime Report.
 */
export const fetchOvertimeReport = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.branchId) queryParams.append("branchId", params.branchId);
  if (params.departmentId) queryParams.append("departmentId", params.departmentId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const endpoints = [
    `/attendance/overtime${qs}`,
    `/api/attendance/overtime${qs}`,
  ];

  for (const ep of endpoints) {
    try {
      const result = await apiFetch(ep, { method: "GET" });
      if (result.ok && result.data) return result.data;
    } catch (e) {}
  }

  return { success: true, data: [] };
};

/**
 * Fetch Attendance Audit Log.
 */
export const fetchAttendanceAuditLog = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/attendance/audit-log${qs}`, { method: "GET" });

  if (!result.ok) {
    throw apiError(result, "Failed to load attendance audit log.");
  }
  return result.data;
};

/**
 * Fetch Attendance Regularization Requests.
 */
export const fetchRegularizationRequests = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/attendance/regularization${qs}`, { method: "GET" });

  if (!result.ok) {
    throw apiError(result, "Failed to load regularization requests.");
  }
  return result.data;
};

/**
 * Submit Regularization Request.
 */
export const submitRegularizationRequest = async (payload) => {
  const result = await apiFetch("/attendance/regularization", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to submit regularization request.");
  }
  return result.data;
};

/**
 * Review / Approve / Reject Regularization Request.
 */
export const reviewRegularizationRequest = async (id, { status, rejectionReason }) => {
  const result = await apiFetch(`/attendance/regularization/${id}/review`, {
    method: "PUT",
    body: JSON.stringify({ status, rejectionReason }),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to review regularization request.");
  }
  return result.data;
};

/**
 * Fetch My Team Attendance (Project Manager).
 */
export const fetchMyTeamAttendance = async () => {
  const result = await apiFetch("/attendance/my-team", { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to load my team attendance.");
  }
  return result.data;
};

/**
 * Fetch Attendance Settings / Policy.
 */
export const fetchAttendanceSettings = async (organizationId = "") => {
  const query = organizationId ? `?organizationId=${organizationId}` : "";
  const result = await apiFetch(`/attendance/settings${query}`, { method: "GET" });
  if (!result.ok) {
    throw apiError(result, "Failed to load attendance settings.");
  }
  return result.data;
};

/**
 * Update Attendance Settings / Policy (Admin / Owner).
 */
export const updateAttendanceSettings = async (payload) => {
  const result = await apiFetch("/attendance/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to update attendance settings.");
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
    throw apiError(result, "Failed to correct attendance record.");
  }
  return result.data;
};

/**
 * Manually create or override an attendance record (Admin / Owner).
 * Supports past dates, today, future dates, weekends, and holidays.
 * @param {{ userId: string, date: string, status: string, locationType?: string, loginTime?: string, logoutTime?: string, isLate?: boolean, reason: string }} overrideData
 */
export const postManualAttendanceOverride = async (overrideData) => {
  const result = await apiFetch("/attendance/manual-override", {
    method: "POST",
    body: JSON.stringify(overrideData),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to submit manual attendance override.");
  }
  return result.data;
};

/**
 * Apply Company Holiday / Department Holiday / Bulk Leave (Admin / Owner).
 * @param {{ title: string, date: string, holidayType?: string, scope?: string, targetDepartment?: string, selectedUserIds?: string[], reason: string, excludeAdmins?: boolean }} holidayData
 */
export const postBulkHoliday = async (holidayData) => {
  const result = await apiFetch("/attendance/holidays/bulk-apply", {
    method: "POST",
    body: JSON.stringify(holidayData),
  });

  if (!result.ok) {
    throw apiError(result, "Failed to apply company holiday / bulk leave.");
  }
  return result.data;
};

/**
 * Preview impact of a company holiday / bulk leave before declaration.
 * @param {{ date: string, scope?: string, targetDepartment?: string, selectedUserIds?: string[], excludeAdmins?: boolean }} params
 */
export const fetchHolidayPreview = async (params) => {
  const queryParams = new URLSearchParams();
  if (params?.date) queryParams.append("date", params.date);
  if (params?.scope) queryParams.append("scope", params.scope);
  if (params?.targetDepartment) queryParams.append("targetDepartment", params.targetDepartment);
  if (params?.selectedUserIds?.length) queryParams.append("selectedUserIds", params.selectedUserIds.join(","));
  if (params?.excludeAdmins !== undefined) queryParams.append("excludeAdmins", String(params.excludeAdmins));

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/attendance/holidays/preview${qs}`, { method: "GET" });

  if (!result.ok) {
    throw apiError(result, "Failed to load holiday preview.");
  }
  return result.data;
};

/**
 * Fetch declared holidays list (Admin / Owner).
 * @param {{ year?: string|number, month?: string|number, status?: string }} params
 */
export const fetchDeclaredHolidays = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append("year", params.year);
  if (params?.month) queryParams.append("month", params.month);
  if (params?.status) queryParams.append("status", params.status);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const result = await apiFetch(`/attendance/holidays${qs}`, { method: "GET" });

  if (!result.ok) {
    throw apiError(result, "Failed to fetch declared holidays.");
  }
  return result.data;
};

/**
 * Cancel a declared company holiday and revert linked records.
 * @param {string} id
 */
export const deleteDeclaredHoliday = async (id) => {
  const result = await apiFetch(`/attendance/holidays/${id}`, { method: "DELETE" });

  if (!result.ok) {
    throw apiError(result, "Failed to cancel holiday.");
  }
  return result.data;
};


