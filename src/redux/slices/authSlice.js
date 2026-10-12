import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { fetchAuthContext } from '../../services/rbacService';
import { API_BASE_URL, getAuthToken, setAuthToken, clearAuthToken, apiFetch } from '../../config/api';

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
const hasToken = Boolean(getAuthToken());

const initialState = {
  user: initialUser,
  role: initialUser?.roleCode || initialUser?.roleName || null,
  tenant: null,
  menus: [],
  permissions: [],
  tokenPresent: hasToken,
  isAuthenticated: Boolean(initialUser) && hasToken,
  nextAction: initialUser && !initialUser.organizationId && !initialUser.tenantId && !initialUser.tenant?._id
    ? 'SETUP_ORGANIZATION'
    : null,
  subscription: null,
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

    const hasOrg = Boolean(
      data?.user?.tenantId ||
      data?.user?.organizationId ||
      data?.tenant?._id ||
      data?.tenant?.organizationId ||
      data?.organization?._id
    );
    const subStatus = (data?.tenant?.subscription?.status || data?.subscription?.status || '').toUpperCase();
    const isExpired = subStatus === 'EXPIRED' || subStatus === 'SUSPENDED';

    const nextAction =
      data?.nextAction ||
      data?.data?.nextAction ||
      (isExpired ? 'RENEW_SUBSCRIPTION' : !hasOrg ? 'SETUP_ORGANIZATION' : 'OPEN_DASHBOARD');

    return {
      user: data?.user || null,
      tenant: data?.tenant || null,
      organization: data?.organization || null,
      subscription: data?.subscription || data?.tenant?.subscription || null,
      nextAction,
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

// Register thunk (POST /api/auth/register).
export const register = createAsyncThunk(
  'auth/register',
  async ({ name, fullName, email, phoneNumber, phone, password }, { rejectWithValue }) => {
    try {
      const payload = {
        name: (name || fullName || '').trim(),
        email: (email || '').trim().toLowerCase(),
        phoneNumber: (phoneNumber || phone || '').trim(),
      };
      if (password) {
        payload.password = password;
      }
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = res?.data || {};
      if (!res.ok || data.success === false || data.error) {
        return rejectWithValue(data.message || data.error || 'Registration failed. Please check your details.');
      }
      if (data.token) setAuthToken(data.token);

      const resolvedUser =
        data.user ||
        data.data?.user ||
        (data.name ? { name: data.name, email: data.email, phoneNumber: data.phoneNumber } : null) ||
        { name: payload.name, email: payload.email, phoneNumber: payload.phoneNumber };

      try {
        if (resolvedUser) localStorage.setItem('user', JSON.stringify(resolvedUser));
        const tid =
          data.tenantId ||
          data.organizationId ||
          resolvedUser?.tenantId ||
          resolvedUser?.organizationId ||
          resolvedUser?.tenant?._id;
        if (tid) {
          localStorage.setItem('tenantId', tid);
          localStorage.setItem('organizationId', tid);
        }
      } catch {
        // ignore storage errors
      }

      const nextAction =
        data.nextAction ||
        data.data?.nextAction ||
        (!resolvedUser?.organizationId && !resolvedUser?.tenantId && !data.tenantId && !data.organizationId
          ? 'SETUP_ORGANIZATION'
          : 'OPEN_DASHBOARD');

      return {
        user: resolvedUser,
        token: data.token || null,
        nextAction,
        subscription: data.subscription || data.data?.subscription || null,
        organization: data.organization || data.data?.organization || null,
        menus: data.menus || resolvedUser?.menus || [],
        permissions: data.permissions || resolvedUser?.permissions || [],
        message: data.message || 'Registration successful',
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Unable to reach the server. Please try again.');
    }
  }
);

// Login thunk (POST /api/auth/login).
export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, email: identifier, password }),
      });
      const data = res?.data || {};
      if (!res.ok || data.success === false || data.error) {
        return rejectWithValue(data.message || data.error || 'Login failed. Please check your credentials.');
      }
      const rawToken = data.token || data.data?.token || null;
      if (rawToken) setAuthToken(rawToken);
      const rawUser = data.data?.user || data.user || null;
      try {
        if (rawUser) localStorage.setItem('user', JSON.stringify(rawUser));
        const tid =
          data.tenantId || data.user?.tenantId || data.user?.organizationId || data.user?.tenant?._id;
        if (tid) localStorage.setItem('tenantId', tid);
      } catch {
        // ignore storage errors — never block login
      }
      // Pass menus/permissions and nextAction through
      const nextAction =
        data.nextAction ||
        data.data?.nextAction ||
        (!data.user?.organizationId && !data.user?.tenantId && !data.tenantId && !data.organizationId
          ? 'SETUP_ORGANIZATION'
          : 'OPEN_DASHBOARD');

      return {
        user: rawUser,
        token: rawToken,
        nextAction,
        subscription: data.subscription || data.data?.subscription || null,
        organization: data.organization || data.data?.organization || null,
        menus: data.menus || rawUser?.menus || [],
        permissions: data.permissions || rawUser?.permissions || [],
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
      state.nextAction = null;
      state.subscription = null;
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
    authSynced: (state, action) => {
      const { user, role, menus, permissions, tokenPresent, nextAction, subscription, fetchedAt } = action.payload || {};
      if (user !== undefined) state.user = user || null;
      const resolvedRole = role || state.user?.roleCode || state.user?.roleName || null;
      state.role = resolvedRole;
      if (Array.isArray(menus)) state.menus = menus;
      if (Array.isArray(permissions)) state.permissions = permissions;
      if (nextAction !== undefined) state.nextAction = nextAction;
      if (subscription !== undefined) state.subscription = subscription;
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
        state.tenant = action.payload.tenant || null;
        state.role = action.payload.user?.roleCode || action.payload.user?.roleName || null;
        state.menus = action.payload.menus;
        state.permissions = action.payload.permissions;
        state.nextAction = action.payload.nextAction || null;
        state.subscription = action.payload.subscription || null;
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
        state.nextAction = action.payload?.nextAction || null;
        state.subscription = action.payload?.subscription || null;
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
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload?.user) {
          state.user = action.payload.user;
          state.role = action.payload.user?.roleCode || action.payload.user?.roleName || null;
        }
        if (Array.isArray(action.payload?.menus)) state.menus = action.payload.menus;
        if (Array.isArray(action.payload?.permissions)) state.permissions = action.payload.permissions;
        state.nextAction = action.payload?.nextAction || 'SETUP_ORGANIZATION';
        state.subscription = action.payload?.subscription || null;
        if (action.payload?.token) state.tokenPresent = true;
        state.isAuthenticated = Boolean(state.user) && state.tokenPresent === true;
        state.error = null;
        if (action.payload?.fetchedAt !== undefined) state.lastFetched = action.payload.fetchedAt;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Registration failed';
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
        state.nextAction = null;
        state.subscription = null;
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
        state.nextAction = null;
        state.subscription = null;
        state.status = 'idle';
        state.error = null;
        state.lastFetched = null;
      });
  },
});

export const { clearAuth, authSynced } = authSlice.actions;

// ---- Selectors ----
export const selectAuthUser = (state) => state.auth?.user || null;
export const selectAuthRole = (state) => state.auth?.role || null;
export const selectAuthMenus = (state) => state.auth?.menus || [];
export const selectAuthPermissions = (state) => state.auth?.permissions || [];
export const selectAuthNextAction = createSelector(
  [(state) => state.auth?.nextAction, (state) => state.auth?.user],
  (nextAction, user) => {
    if (nextAction) return nextAction;
    if (user && !user.organizationId && !user.tenantId && !user.tenant?._id) {
      return 'SETUP_ORGANIZATION';
    }
    return user ? 'OPEN_DASHBOARD' : null;
  }
);
export const selectAuthSubscription = (state) => state.auth?.subscription || null;
export const selectAuthStatus = (state) => state.auth?.status || 'idle';
export const selectAuthError = (state) => state.auth?.error || null;
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
// Permission codes are matched case-insensitively: the backend catalog
// stores lowercase codes (schema enforces lowercase:true) while some call
// sites use the historical camelCase form (e.g. "costCenter.view"). The
// catalog contains no two codes differing only by case, so this is exact.
const permEquals = (stored, wanted) =>
  typeof stored === "string" && typeof wanted === "string"
    ? stored.toLowerCase() === wanted.toLowerCase()
    : stored === wanted;
const hasPermCode = (permissions, permCode) =>
  (permissions || []).some((p) => permEquals(p, permCode));
export const selectHasPermission = (state, permCode) => {
  const s = state.auth;
  if (!s?.user) return false;
  if (s.user.priority === 1 || s.user.roleCode === 'OWNER' || (s.permissions || []).includes('*'))
    return true;
  return hasPermCode(s.permissions, permCode);
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
      return hasPermCode(permissions, permCode);
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

export const selectAuthTenant = (state) => state.auth?.tenant;
export const selectAuthScope = (state) =>
  state.auth?.user?.scope || (state.auth?.user?.priority === 1 || state.auth?.user?.roleCode === 'OWNER' ? 'ORGANIZATION' : 'BRANCH');
export const selectAuthAccessLevel = (state) =>
  state.auth?.tenant?.accessLevel || state.auth?.user?.scope || (state.auth?.user?.priority === 1 || state.auth?.user?.roleCode === 'OWNER' ? 'ORGANIZATION' : 'BRANCH');

// Canonical permission check alias
export const can = selectHasPermission;
export const useCan = useHasPermission;

export default authSlice.reducer;
