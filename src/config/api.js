// ============================================================
// Central API config — every page should import from here
// Connected to the live AWS backend API.
// ============================================================

// Reads from HRMSUI/.env (REACT_APP_API_BASE_URL).
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL;

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

// ---- Centralized auth-recovery hooks (no store imports here — that would
// create a module cycle. Owners with store access register handlers.) ----
let unauthorizedHandler = null;
let unauthorizedNotified = false;
let branchMismatchHandler = null;

// Runtime 401 recovery (registered once by App using the existing logout
// flow).
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
  if (!unauthorizedHandler) unauthorizedNotified = false;
};

// Branch-mismatch recovery sync (registered once by BranchContext, the owner
// of branch selection). Lets the authoritative React state follow what
// apiFetch just did to storage, instead of diverging until reload.
export const setBranchMismatchHandler = (fn) => {
  branchMismatchHandler = typeof fn === 'function' ? fn : null;
};

const AUTH_OWNED_PATHS = ['/auth/login', '/auth/me', '/user/logout'];

// Called on an authenticated 401. Single-flight: concurrent 401s notify
// once; the flag resets on the next successful response so a later,
// unrelated expiry can still trigger recovery. Returns normally in all
// cases so callers keep their existing local 401 handling.
const notifyUnauthorized = (path) => {
  if (!getAuthToken()) return;
  if (AUTH_OWNED_PATHS.some((p) => path === p || path.endsWith(p))) return;
  if (unauthorizedNotified) return;
  if (!unauthorizedHandler) return;
  unauthorizedNotified = true;
  try {
    unauthorizedHandler();
  } catch {
    // Recovery must never break the in-flight request handling.
    unauthorizedNotified = false;
  }
};

// Helper: fetch + safe JSON/text parse + auto auth header.
// Usage: const data = await apiFetch("/project/getAllProjects");
export const apiFetch = async (path, options = {}, isRetry = false) => {
  try {
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;
    const rawHeaders = {
      // JSON bodies get a Content-Type; FormData must NOT (the browser sets
      // the multipart boundary). Previously every FormData caller had to
      // remember to strip this manually.
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
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

    const cleanBase = (API_BASE_URL || "").replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const finalPath = (cleanBase.endsWith("/api") && cleanPath.startsWith("/api/"))
      ? cleanPath.substring(4)
      : (cleanBase.endsWith("/api") && cleanPath === "/api")
        ? ""
        : cleanPath;
    const url = `${cleanBase}${finalPath}`;

    const res = await fetch(url, {
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
      let cleanMessage = text;
      if (text.includes("<pre>") && text.includes("</pre>")) {
        cleanMessage = text.split("<pre>")[1].split("</pre>")[0].trim();
      } else if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
        cleanMessage = `Server error (${res.status} ${res.statusText || "Not Found"}) on ${path}`;
      }
      data = { message: cleanMessage || `HTTP ${res.status} ${res.statusText}` };
    }

    // Auto-recovery if branch mismatch error is returned
    const errMsg = (data?.message || "").toLowerCase();
    if (!res.ok && !isRetry && (errMsg.includes("branch does not belong") || errMsg.includes("requested branch"))) {
      console.warn("apiFetch: Detected branch mismatch. Clearing selectedBranchId and retrying without x-branch-id...");
      localStorage.removeItem("selectedBranchId");
      // Notify the branch owner (BranchContext) so its React state follows
      // the storage change instead of diverging until reload. Ownership
      // stays with the context — this is a notification, not a write.
      try {
        if (branchMismatchHandler) branchMismatchHandler();
      } catch {
        // Recovery notification must never break the retry below.
      }
      const retryHeaders = { ...options.headers };
      delete retryHeaders["x-branch-id"];
      return apiFetch(path, { ...options, headers: retryHeaders }, true);
    }

    // Auto-recovery for 404 route prefix mismatch: try with /api prefix if base doesn't have it
    if (!res.ok && res.status === 404 && !isRetry) {
      if (!cleanBase.endsWith("/api") && !cleanPath.startsWith("/api")) {
        return apiFetch(`/api${cleanPath}`, options, true);
      }
    }

    // A successful response re-arms single-flight 401 notification so a
    // later, unrelated expiry can still trigger recovery.
    if (res.ok) {
      unauthorizedNotified = false;
      return { ok: res.ok, status: res.status, data };
    }

    // Centralized runtime 401 recovery (single-flight). The response still
    // propagates normally so existing per-call 401 handling is preserved.
    if (res.status === 401) {
      notifyUnauthorized(cleanPath);
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

/**
 * Shared query-string builder (single copy — use everywhere instead of
 * local clones). Skips undefined/null/"" values.
 */
export const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val);
    }
  });
  const qStr = query.toString();
  return qStr ? `?${qStr}` : "";
};

/**
 * Consistent API error carrying HTTP status + response payload.
 * Backend 403s carry additive machine-readable keys alongside the message:
 * requiredPermission (requirePermission), requiredPriority (isAdmin → 2),
 * requiredMenu (checkMenuAccess), requiredAnyPermission + requiredPermission
 * (ownership routes). Keys are ABSENT (not null) when not applicable.
 * 401 = re-login; 403 = AccessDenied with key — never redirect to login.
 */
export const apiError = (res, fallbackMessage = "Request failed") => {
  const message = res?.data?.message || res?.data?.error || fallbackMessage;
  const err = new Error(message);
  err.status = res?.status;
  err.data = res?.data;
  err.requiredPermission = res?.data?.requiredPermission;
  err.requiredPriority = res?.data?.requiredPriority;
  err.requiredMenu = res?.data?.requiredMenu;
  err.requiredAnyPermission = res?.data?.requiredAnyPermission;
  return err;
};  