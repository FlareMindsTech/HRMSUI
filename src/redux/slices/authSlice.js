import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
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
      return { user: data.user || null, token: data.token || null };
    } catch (err) {
      return rejectWithValue(err.message || 'Unable to reach the server. Please try again.');
    }
  }
);

// Logout thunk — best-effort server call, always clears local session state.
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
    }).catch(() => null);
  } catch {
    // ignore — local clear below is what matters
  }
  clearAuthToken();
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
      const { user, role, menus, permissions } = action.payload || {};
      if (user !== undefined) state.user = user || null;
      const resolvedRole = role || state.user?.roleCode || state.user?.roleName || null;
      state.role = resolvedRole;
      if (Array.isArray(menus)) state.menus = menus;
      if (Array.isArray(permissions)) state.permissions = permissions;
      state.tokenPresent = Boolean(getAuthToken());
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
        state.tokenPresent = Boolean(getAuthToken());
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
        state.tokenPresent = Boolean(getAuthToken());
        state.isAuthenticated = Boolean(state.user);
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
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

export default authSlice.reducer;
