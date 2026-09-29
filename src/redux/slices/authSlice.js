import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { fetchAuthContext } from '../../services/rbacService';
import { API_BASE_URL, getAuthToken, setAuthToken, clearAuthToken } from '../../config/api';

// Safely read initial user and auth state from localStorage
const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Keys that make up the local session. Keep in one place so login, logout,
// boot-recovery and every logout button clear the same set (previously each
// call-site removed a different subset, leaving stale tenant/org behind).
const SESSION_KEYS = [
  'user',
  'isAuthenticated',
  'tenantId',
  'organizationId',
  'selectedBranchId',
  'cached_org_profile',
];

const clearLocalSession = () => {
  clearAuthToken();
  try {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore storage errors — Redux state clear below is what matters
  }
};

const initialUser = getInitialUser();

const initialState = {
  user: initialUser,
  role: initialUser?.roleCode || initialUser?.roleName || null,
  menus: [],
  permissions: [],
  tokenPresent: Boolean(getAuthToken()),
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  lastFetched: null,
};

// Fetch live auth context (GET /auth/me).
export const fetchAuth = createAsyncThunk('auth/fetchAuth', async (_, { rejectWithValue }) => {
  try {
    const token = getAuthToken();
    if (!token) return rejectWithValue('No token');
    const data = await fetchAuthContext();
    // Persist cache (previously done by AuthContext.loadAuthContext).
    try {
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
      const tid =
        data?.user?.tenantId || data?.user?.organizationId || data?.tenantId || data?.user?.tenant?._id;
      if (tid) localStorage.setItem('tenantId', tid);
    } catch {
      // ignore storage errors — never block auth load
    }
    return {
      user: data?.user || null,
      menus: data?.menus || [],
      permissions: data?.permissions || [],
    };
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to load session');
  }
});

// Login thunk (POST /auth/login).
export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, email: identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || 'Login failed. Please check your credentials.');
      }
      if (data.token) setAuthToken(data.token);
      try {
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        const tid =
          data.tenantId || data.user?.tenantId || data.user?.organizationId || data.user?.tenant?._id;
        if (tid) localStorage.setItem('tenantId', tid);
      } catch {
        // ignore storage errors — never block login
      }
      // Pass menus/permissions through when the login response already
      // includes them so callers don't need a second GET /auth/me trip.
      return {
        user: data.user || null,
        token: data.token || null,
        menus: data.menus || data.user?.menus || [],
        permissions: data.permissions || data.user?.permissions || [],
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Unable to reach the server. Please try again.');
    }
  }
);

// Logout thunk — clears local session SYNCHRONOUSLY first so the UI (route
// gate, logout.pending reducer) flips to /login instantly, then pings the
// server fire-and-forget with a short timeout. Previously the thunk awaited
// the network before clearing, and callers did a full window.location reload,
// which made logout feel slow and raced the token clear.
export const logout = createAsyncThunk('auth/logout', async () => {
  const token = getAuthToken();
  clearLocalSession();
  if (token) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      await fetch(`${API_BASE_URL}/user/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timer);
    } catch {
      // ignore — local session is already cleared, which is what matters
    }
  }
  return true;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { user, role, permissions } = action.payload || {};
      state.user = user || null;
      state.role = role || user?.roleCode || user?.roleName || null;
      state.permissions = Array.isArray(permissions) ? permissions : [];
      state.isAuthenticated = Boolean(user);
    },
    clearAuth: (state) => {
      state.user = null;
      state.role = null;
      state.menus = [];
      state.permissions = [];
      state.tokenPresent = false;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
    setPermissions: (state, action) => {
      state.permissions = Array.isArray(action.payload) ? action.payload : [];
    },
    authSynced: (state, action) => {
      const { user, role, menus, permissions, tokenPresent } = action.payload || {};
      if (user !== undefined) state.user = user || null;
      const resolvedRole = role || state.user?.roleCode || state.user?.roleName || null;
      state.role = resolvedRole;
      if (Array.isArray(menus)) state.menus = menus;
      if (Array.isArray(permissions)) state.permissions = permissions;
      // Prefer the caller-supplied flag; reading localStorage inside a reducer
      // is a side effect and costs main-thread I/O on every sync.
      state.tokenPresent = tokenPresent !== undefined ? Boolean(tokenPresent) : state.tokenPresent;
      state.isAuthenticated = Boolean(state.user);
      state.status = 'succeeded';
      state.error = null;
      state.lastFetched = Date.now();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.role = action.payload.user?.roleCode || action.payload.user?.roleName || null;
        state.menus = action.payload.menus;
        state.permissions = action.payload.permissions;
        // The request just succeeded with the stored token, so it is present.
        // (Avoids a localStorage read inside the reducer.)
        state.tokenPresent = true;
        state.isAuthenticated = Boolean(action.payload.user);
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load session';
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload?.user) {
          state.user = action.payload.user;
          state.role = action.payload.user?.roleCode || action.payload.user?.roleName || null;
        }
        // Login responses may already carry access data — apply it so the
        // sidebar doesn't render empty while a second fetchAuth is in flight.
        if (Array.isArray(action.payload?.menus)) state.menus = action.payload.menus;
        if (Array.isArray(action.payload?.permissions)) state.permissions = action.payload.permissions;
        // Login just stored the token in the thunk — no need to re-read storage.
        if (action.payload?.token) state.tokenPresent = true;
        state.isAuthenticated = Boolean(state.user);
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      // Clear on pending (not just fulfilled) so the route gate flips to
      // /login the same tick the user clicks Sign Out — no waiting for the
      // best-effort server ping.
      .addCase(logout.pending, (state) => {
        state.user = null;
        state.role = null;
        state.menus = [];
        state.permissions = [];
        state.tokenPresent = false;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
        state.lastFetched = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.menus = [];
        state.permissions = [];
        state.tokenPresent = false;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
        state.lastFetched = null;
      });
  },
});

export const { setAuth, clearAuth, setPermissions, authSynced, clearAuthError } = authSlice.actions;

// ---- Selectors ----
const selectAuth = (state) => state.auth;

export const selectAuthUser = createSelector([selectAuth], (s) => s?.user || null);
export const selectAuthRole = createSelector([selectAuth], (s) => s?.role || null);
export const selectAuthMenus = createSelector([selectAuth], (s) => s?.menus || []);
export const selectAuthPermissions = createSelector([selectAuth], (s) => s?.permissions || []);
export const selectAuthStatus = createSelector([selectAuth], (s) => s?.status || 'idle');
export const selectAuthError = createSelector([selectAuth], (s) => s?.error || null);
export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (s) => Boolean(s?.user) && s?.tokenPresent === true
);
export const selectIsSystemAdmin = createSelector([selectAuth], (s) => {
  const user = s?.user;
  const permissions = s?.permissions || [];
  return (
    user?.priority === 1 ||
    user?.priority === 2 ||
    user?.roleCode === 'OWNER' ||
    user?.roleCode === 'ADMIN' ||
    permissions.includes('*')
  );
});
export const selectHasPermission = (state, permCode) => {
  const s = state.auth;
  if (!s?.user) return false;
  if (s.user.priority === 1 || s.user.roleCode === 'OWNER' || (s.permissions || []).includes('*'))
    return true;
  return (s.permissions || []).includes(permCode);
};
export const selectHasMenu = (state, menuCode) => {
  const s = state.auth;
  if (!s?.user) return false;
  if (s.user.priority === 1 || s.user.roleCode === 'OWNER' || (s.permissions || []).includes('*'))
    return true;
  return (s.menus || []).includes(menuCode);
};

// ---- Stable permission hooks ----
// WARNING: do NOT inline these as `useSelector((state) => (code) => ...)`.
// That returns a new function on every store update and re-renders the
// component on every dispatch (login alone dispatches 4 actions). These hooks
// subscribe only to the underlying user/permissions/menus references, so the
// returned callback identity is stable until access data actually changes.
export const useHasPermission = () => {
  const user = useSelector(selectAuthUser);
  const permissions = useSelector(selectAuthPermissions);
  return useCallback(
    (permCode) => {
      if (!user) return false;
      if (user.priority === 1 || user.roleCode === 'OWNER' || (permissions || []).includes('*'))
        return true;
      return (permissions || []).includes(permCode);
    },
    [user, permissions]
  );
};

export const useHasMenu = () => {
  const user = useSelector(selectAuthUser);
  const permissions = useSelector(selectAuthPermissions);
  const menus = useSelector(selectAuthMenus);
  return useCallback(
    (menuCode) => {
      if (!user) return false;
      if (user.priority === 1 || user.roleCode === 'OWNER' || (permissions || []).includes('*'))
        return true;
      return (menus || []).includes(menuCode);
    },
    [user, permissions, menus]
  );
};

export default authSlice.reducer;
