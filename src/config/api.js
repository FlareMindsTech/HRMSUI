// ============================================================
// Central API config — every page should import from here
// instead of hardcoding "http://localhost:7800/api" locally.
// ============================================================

// Reads from HRMSUI/.env -> REACT_APP_API_BASE_URL
// Falls back to localhost:7800 if .env is missing (dev convenience).
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

// Small helper: fetch + auto JSON parse + auto auth header.
// Usage: const data = await apiFetch("/project/getAllProjects");
export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
};