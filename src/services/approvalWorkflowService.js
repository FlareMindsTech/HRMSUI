import { apiFetch, apiError, buildQuery } from "../config/api";

/**
 * Approval Workflow API Service
 */

export const configureWorkflow = async (payload) => {
  const res = await apiFetch("/approval-workflow/configure", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to configure approval workflow.");
  return res.data;
};

export const getWorkflows = async () => {
  const res = await apiFetch("/approval-workflow/workflows", {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch approval workflows.");
  return res.data;
};

export const getPendingApprovals = async (params = {}) => {
  const res = await apiFetch(`/approval-workflow/pending-requests${buildQuery(params)}`, {
    method: "GET",
  });
  if (!res.ok) throw apiError(res, "Failed to fetch pending approval requests.");
  return res.data;
};

export const processApprovalAction = async (payload) => {
  const res = await apiFetch("/approval-workflow/process-action", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw apiError(res, "Failed to process approval action.");
  return res.data;
};

const approvalWorkflowService = {
  configureWorkflow,
  getWorkflows,
  getPendingApprovals,
  processApprovalAction,
};

export default approvalWorkflowService;
