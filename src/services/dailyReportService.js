import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Daily Report API Service
 */

export const submitDailyReport = async (payload) => {
  const res = await apiFetch("/daily-report/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to submit daily report.");
  return res.data;
};

export const getMyDailyReports = async (params = {}) => {
  const res = await apiFetch(`/daily-report/my-reports${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch my daily reports.");
  return res.data;
};

export const getDailyReportsByProject = async (projectId, params = {}) => {
  const res = await apiFetch(`/daily-report/project/${projectId}${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch project daily reports.");
  return res.data;
};

export const getAllDailyReports = async (params = {}) => {
  const res = await apiFetch(`/daily-report/all${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch all daily reports.");
  return res.data;
};

export const getDailyReportById = async (id) => {
  const res = await apiFetch(`/daily-report/${id}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch daily report details.");
  return res.data;
};

export const addCommentToDailyReport = async (id, commentText) => {
  const res = await apiFetch(`/daily-report/${id}/comment`, {
    method: "POST",
    body: JSON.stringify({ commentText }),
  });
  if (!res.ok) throw apiError(res, "Failed to add comment to daily report.");
  return res.data;
};

export const deleteDailyReport = async (id) => {
  const res = await apiFetch(`/daily-report/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw apiError(res, "Failed to delete daily report.");
  return res.data;
};

const dailyReportService = {
  submitDailyReport,
  getMyDailyReports,
  getDailyReportsByProject,
  getAllDailyReports,
  getDailyReportById,
  addCommentToDailyReport,
  deleteDailyReport,
};

export default dailyReportService;
