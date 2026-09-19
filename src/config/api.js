// ============================================================
// Central API config — every page should import from here
// Connected to the live AWS backend API.
// ============================================================

// Reads from HRMSUI/.env -> REACT_APP_API_BASE_URL
// Default fallback is the live AWS backend API endpoint
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:7800/api";

// Token is stored under this key in localStorage after a real login.
const TOKEN_KEY = "token";

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const setAuthToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

// Standard Authorization header for authenticated requests.
export const authHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
});

// Helper: fetch + safe JSON/text parse + auto auth header.
// Usage: const data = await apiFetch("/project/getAllProjects");
export const apiFetch = async (path, options = {}) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...authHeaders(),
        ...(options.headers || {}),
      },
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

    return { ok: res.ok, status: res.status, data };
  } catch (netErr) {
    return {
      ok: false,
      status: 0,
      data: { message: netErr.message || "Network request failed" },
    };
  }
};  