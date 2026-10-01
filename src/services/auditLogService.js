import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Audit Log API Service
 */

export const getAuditLogs = async (params = {}) => {
  const res = await apiFetch(`/audit-log/logs${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch audit logs.");
  return res.data;
};

const auditLogService = {
  getAuditLogs,
};

export default auditLogService;
