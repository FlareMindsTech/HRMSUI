/**
 * Attendance & Session API Service (Re-export layer)
 * Re-exports from dedicated Attendance API module: src/Api/Attendance/attendance.js
 */

import { apiFetch } from "../config/api";

export {
  fetchTodayAttendance,
  punchInUser,
  punchOutUser,
  fetchMyAttendance,
  fetchAttendanceByMonth,
  fetchTeamAttendance,
  fetchAttendanceAnalytics,
  updateAttendanceCorrection,
  fetchTeamAttendanceToday,
} from "../Api/Attendance/attendance";

/**
 * End the current user session (application logout only).
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
