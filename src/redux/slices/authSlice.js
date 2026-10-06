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

// Freshness window for skipping redundant session revalidations. Post-
// mutation callers pass { force: true } and always refetch.
const AUTH_TTL_MS = 60 * 1000;

// Fetch live auth context (GET /auth/me).
// Backend contract (locked): { data: { user, tenant } } where user carries
// permissions[] + menus[] as string codes, priority, roleCode,
// organizationId, branchId, assignedBranchIds. No top-level menus/permissions.
export const fetchAuth = createAsyncThunk('auth/fetchAuth', async (_, { rejectWithValue }) => {
  try {
    const token = getAuthToken();
    if (!token) return rejectWithValue({ message: 'No token', status: 401 });
    const data = await fetchAuthContext();
    // Persist cache (previously done by AuthContext.loadAuthContext).
    try {
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
      const tid =
        data?.user?.tenantId || data?.user?.organizationId || data?.tenant?._id || data?.tenant?.organizationId;
      if (tid) {
        localStorage.setItem('tenantId', tid);
        localStorage.setItem('organizationId', tid);
      }
    } catch {
      // ignore storage errors — never block auth load
    }
    return {
      user: data?.user || null,
      tenant: data?.tenant || null,
      menus: data?.user?.menus || [],
      permissions: data?.user?.permissions || [],
      // Timestamp is produced here in the thunk (side-effect-capable layer)
      // so the reducer stays a pure state transition.
      fetchedAt: Date.now(),
    };
  } catch (err) {
    // 401 vs 403 discipline: the rejected payload carries the HTTP status so
    // callers redirect to login on 401 only — never on 403 (AccessDenied).
    return rejectWithValue({ message: err.message || 'Failed to load session', status: err.status });
  }
},
  {
    // Skip redundant revalidations: same-tick duplicates (StrictMode/boot),
    // and refreshes within the TTL when a user with access data is already
    // loaded. A fetch still proceeds when there is no user, no menus (e.g.
    // a login response that carried no access data), or stale data — so the
    // login background refresh and boot validation behave exactly as before
    // in every case that matters. Post-mutation callers pass { force: true }.
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const s = getState().auth;
      if (!s) return true;
      if (s.status === 'loading') return false;
      if (
        s.user &&
        (s.menus || []).length > 0 &&
        s.lastFetched &&
        Date.now() - s.lastFetched < AUTH_TTL_MS
      ) {
        return false;
      }
      return true;
    },
  }
);

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
        // Timestamp is produced here in the thunk (side-effect-capable layer)
        // so the reducer stays a pure state transition.
        fetchedAt: Date.now(),
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
    authSynced: (state, action) => {
      const { user, role, menus, permissions, tokenPresent, fetchedAt } = action.payload || {};
      if (user !== undefined) state.user = user || null;
      const resolvedRole = role || state.user?.roleCode || state.user?.roleName || null;
      state.role = resolvedRole;
      if (Array.isArray(menus)) state.menus = menus;
      if (Array.isArray(permissions)) state.permissions = permissions;
      // Prefer the caller-supplied flag; reading localStorage inside a reducer
      // is a side effect and costs main-thread I/O on every sync.
      state.tokenPresent = tokenPresent !== undefined ? Boolean(tokenPresent) : state.tokenPresent;
      // Derived from the same inputs as selectIsAuthenticated (user +
      // tokenPresent) instead of a second independent truth source. The
      // timestamp arrives via the action payload so the reducer performs no
      // clock reads.
      state.isAuthenticated = Boolean(state.user) && state.tokenPresent === true;
      state.status = 'succeeded';
      state.error = null;
      if (fetchedAt !== undefined) state.lastFetched = fetchedAt;
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
        state.isAuthenticated = Boolean(action.payload.user) && state.tokenPresent === true;
        state.error = null;
        if (action.payload.fetchedAt !== undefined) state.lastFetched = action.payload.fetchedAt;
      })
      .addCase(fetchAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.payload || 'Failed to load session';
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
        state.isAuthenticated = Boolean(state.user) && state.tokenPresent === true;
        state.error = null;
        if (action.payload?.fetchedAt !== undefined) state.lastFetched = action.payload.fetchedAt;
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

export const { clearAuth, authSynced } = authSlice.actions;

// ---- Selectors (field-level inputs: each recomputes ONLY when its own
// field changes, never on unrelated status/error/lastFetched churn) ----
export const selectAuthUser = createSelector(
  [(state) => state.auth?.user],
  (user) => user || null
);
export const selectAuthRole = createSelector(
  [(state) => state.auth?.role],
  (role) => role || null
);
export const selectAuthMenus = createSelector(
  [(state) => state.auth?.menus],
  (menus) => menus || []
);
export const selectAuthPermissions = createSelector(
  [(state) => state.auth?.permissions],
  (permissions) => permissions || []
);
export const selectAuthStatus = createSelector(
  [(state) => state.auth?.status],
  (status) => status || 'idle'
);
export const selectAuthError = createSelector(
  [(state) => state.auth?.error],
  (error) => error || null
);
export const selectIsAuthenticated = createSelector(
  [(state) => state.auth?.user, (state) => state.auth?.tokenPresent],
  (user, tokenPresent) => Boolean(user) && tokenPresent === true
);
export const selectIsSystemAdmin = createSelector(
  [(state) => state.auth?.user, (state) => state.auth?.permissions],
  (user, permissions) => {
    const perms = permissions || [];
    return (
      user?.priority === 1 ||
      user?.priority === 2 ||
      user?.roleCode === 'OWNER' ||
      user?.roleCode === 'ADMIN' ||
      perms.includes('*')
    );
  }
);
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
