// ============================================================
// Central API config — every page should import from here
// Connected to the live AWS backend API.
// ============================================================

// Reads from HRMSUI/.env or dynamically detects localhost
const isLocalhost =
  typeof window !== "undefined"
    ? window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
    : process.env.NODE_ENV !== "production";

export const API_BASE_URL = isLocalhost
  ? (process.env.REACT_APP_LOCAL_API_BASE_URL || "http://localhost:7800/api")
  : (process.env.REACT_APP_API_BASE_URL || "https://3.6.122.34/api");

// Token is stored under this key in localStorage after a real login.
const TOKEN_KEY = "token";

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const setAuthToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

// Standard Authorization & Tenant header for authenticated requests.
export const authHeaders = (path = "") => {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Multi-tenant SaaS support: attach x-tenant-id and x-organization-id if present
  const explicitTenant = localStorage.getItem("tenantId") || localStorage.getItem("organizationId");
  if (explicitTenant) {
    headers["x-tenant-id"] = explicitTenant;
    headers["x-organization-id"] = explicitTenant;
  } else {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const tid = parsed.tenantId || parsed.organizationId || parsed.tenant?._id || parsed.tenant;
        if (tid && typeof tid === "string") {
          headers["x-tenant-id"] = tid;
          headers["x-organization-id"] = tid;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  // Organization-level root endpoints should not be scoped to a specific branch
  const isOrgRootPath =
    path === "/organization" ||
    path === "/organization/me" ||
    path === "/organization/structure" ||
    path === "/organization/create" ||
    path === "/organization/update" ||
    path === "/organizations" ||
    (path.startsWith("/organization/") &&
      !path.startsWith("/organization/branch") &&
      !path.startsWith("/organization/department") &&
      !path.startsWith("/organization/designation") &&
      !path.startsWith("/organization/location") &&
      !path.startsWith("/organization/team") &&
      !path.startsWith("/organization/shift") &&
      !path.startsWith("/organization/work-calendar") &&
      !path.startsWith("/organization/cost-center") &&
      !path.startsWith("/organization/job-grade") &&
      !path.startsWith("/organization/holiday-calendar") &&
      !path.startsWith("/organization/financial-year"));

  // Branch context header if actively selected and not on an org-root endpoint
  const selectedBranch = localStorage.getItem("selectedBranchId");
  if (!isOrgRootPath && selectedBranch && selectedBranch !== "all" && selectedBranch !== "null") {
    headers["x-branch-id"] = selectedBranch;
  }

  return headers;
};

// Helper: fetch + safe JSON/text parse + auto auth header.
// Usage: const data = await apiFetch("/project/getAllProjects");
export const apiFetch = async (path, options = {}, isRetry = false) => {
  try {
    const rawHeaders = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(path),
      ...(options.headers || {}),
    };

    // Clean up any undefined/null/empty branch headers
    const finalHeaders = {};
    Object.entries(rawHeaders).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "undefined" && v !== "null") {
        finalHeaders[k] = v;
      }
    });

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: finalHeaders,
    });

    let data;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch (err) {
        data = { message: `Failed to parse response: ${err.message}` };
      }
    } else {
      const text = await res.text();
      data = { message: text || `HTTP ${res.status} ${res.statusText}` };
    }

    // Auto-recovery if branch mismatch error is returned
    const errMsg = (data?.message || "").toLowerCase();
    if (!res.ok && !isRetry && (errMsg.includes("branch does not belong") || errMsg.includes("requested branch"))) {
      console.warn("apiFetch: Detected branch mismatch. Clearing selectedBranchId and retrying without x-branch-id...");
      localStorage.removeItem("selectedBranchId");
      const retryHeaders = { ...options.headers };
      delete retryHeaders["x-branch-id"];
      return apiFetch(path, { ...options, headers: retryHeaders }, true);
    }

    return { ok: res.ok, status: res.status, data };
  } catch (netErr) {
    return {
      ok: false,
      status: 0,
      data: { message: netErr.message || "Network request failed" },
    };
  }
};  