import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Time Tracking / Timesheet API Service
 */

export const logTime = async (payload) => {
  const res = await apiFetch("/time-tracking/log", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to log time.");
  return res.data;
};

export const getTimeLogsByTask = async (taskId) => {
  const res = await apiFetch(`/time-tracking/task/${taskId}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch task time logs.");
  return res.data;
};

export const getTimeLogsByUser = async (userId, params = {}) => {
  const res = await apiFetch(`/time-tracking/user/${userId}${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch user time logs.");
  return res.data;
};

export const updateTimeLog = async (id, payload) => {
  const res = await apiFetch(`/time-tracking/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to update time log.");
  return res.data;
};

const timeTrackingService = {
  logTime,
  getTimeLogsByTask,
  getTimeLogsByUser,
  updateTimeLog,
};

export default timeTrackingService;
