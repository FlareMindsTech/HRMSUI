import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  fetchAllRoles,
  fetchAssignableRoles,
  fetchPermissionCatalog,
  fetchAllMenus,
} from '../../services/rbacService';

// Shared RBAC master data (roles, assignable roles, permission catalog,
// menus) previously fetched independently by every page that renders a role
// picker (UserManagement, HrOnboarding). Centralizing here removes the
// duplicated requests while keeping every page-local concern — role forms,
// permission editing, search/filter/pagination, modals, mutation loading
// flags — in local component state.
//
// Response shapes are preserved exactly (arrays stay arrays, the catalog
// stays a { module: [...] } object). Derived views (filtered lists,
// selected entries) stay in components via plain finds/filters.

const ACCESS_MASTERS_TTL_MS = 5 * 60 * 1000;

const initialState = {
  roles: [],
  assignableRoles: [],
  permissionCatalog: {},
  menus: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  lastFetched: null,
  // Identity of the newest in-flight request; stale responses are dropped
  // against it so a slow earlier fetch can never overwrite newer results.
  activeRequest: null,
};

// Fetch all four masters in one guarded thunk. Each source keeps the same
// per-fetch fallback the pages used before ([] / {}), so one failing
// endpoint no longer fails the whole batch.
export const fetchAccessMasters = createAsyncThunk(
  'access/fetchMasters',
  async ({ force = false } = {}, { rejectWithValue }) => {
    try {
      const [roles, assignableRoles, permissionCatalog, menus] = await Promise.all([
        fetchAllRoles().catch(() => []),
        fetchAssignableRoles().catch(() => []),
        fetchPermissionCatalog().catch(() => ({})),
        fetchAllMenus().catch(() => []),
      ]);
      return {
        roles: Array.isArray(roles) ? roles : [],
        assignableRoles: Array.isArray(assignableRoles) ? assignableRoles : [],
        permissionCatalog: permissionCatalog || {},
        menus: Array.isArray(menus) ? menus : [],
        // Timestamp is produced here in the thunk (side-effect-capable layer)
        // so the reducer stays a pure state transition.
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load access data');
    }
  },
  {
    // Skip duplicate in-flight work and honor the TTL cache. `force: true`
    // (used after role mutations) bypasses both guards.
    condition: ({ force = false } = {}, { getState }) => {
      if (force) return true;
      const s = getState().access;
      if (!s) return true;
      if (s.status === 'loading') return false;
      if (s.lastFetched && Date.now() - s.lastFetched < ACCESS_MASTERS_TTL_MS) {
        return false;
      }
      return true;
    },
  }
);

// Server-filtered roles fetch (spec E): GET /role supports search,
// isActive, isSystemRole, priority, accessLevel, page, limit (cap 100).
// Replaces `roles` with the server-filtered list; callers restore the full
// list via fetchAccessMasters({ force: true }) when filters clear. No TTL —
// filter changes always hit the server. Client-side filtering stays as a
// second pass in components.
export const fetchRolesFiltered = createAsyncThunk(
  'access/fetchRolesFiltered',
  async (params = {}, { rejectWithValue }) => {
    try {
      const list = await fetchAllRoles({ limit: 100, ...params });
      return {
        roles: Array.isArray(list) ? list : [],
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load roles');
    }
  }
);

export const accessSlice = createSlice({
  name: 'access',
  initialState,
  reducers: {
    clearAccessError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessMasters.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.activeRequest = action.meta.requestId;
      })
      .addCase(fetchAccessMasters.fulfilled, (state, action) => {
        // Drop stale responses: only the newest request may paint.
        if (state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'succeeded';
        state.roles = action.payload.roles;
        state.assignableRoles = action.payload.assignableRoles;
        state.permissionCatalog = action.payload.permissionCatalog;
        state.menus = action.payload.menus;
        state.error = null;
        if (action.payload.fetchedAt !== undefined) {
          state.lastFetched = action.payload.fetchedAt;
        }
      })
      .addCase(fetchAccessMasters.rejected, (state, action) => {
        // A condition-guard skip also lands here (meta.condition); it must
        // not clobber healthy cached data, so only record genuine errors.
        // Likewise, a stale request's failure must not clear the newer
        // request's loading state or results.
        if (action.meta?.condition) return;
        if (state.activeRequest && state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'failed';
        state.error = action.payload || 'Failed to load access data';
      })
      .addCase(fetchRolesFiltered.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.activeRequest = action.meta.requestId;
      })
      .addCase(fetchRolesFiltered.fulfilled, (state, action) => {
        if (state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'succeeded';
        state.roles = action.payload.roles;
        state.error = null;
        if (action.payload.fetchedAt !== undefined) {
          state.lastFetched = action.payload.fetchedAt;
        }
      })
      .addCase(fetchRolesFiltered.rejected, (state, action) => {
        if (state.activeRequest && state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'failed';
        state.error = action.payload || 'Failed to load roles';
      });
  },
});

export const { clearAccessError } = accessSlice.actions;

// ---- Selectors (field-level inputs: each selector recomputes ONLY when
// its own field changes, never on unrelated status/error/identity churn) ----
export const selectRoles = createSelector(
  [(state) => state.access?.roles],
  (roles) => roles || []
);
export const selectAssignableRoles = createSelector(
  [(state) => state.access?.assignableRoles],
  (roles) => roles || []
);
export const selectPermissionCatalog = createSelector(
  [(state) => state.access?.permissionCatalog],
  (catalog) => catalog || {}
);
export const selectAllMenus = createSelector(
  [(state) => state.access?.menus],
  (menus) => menus || []
);
export const selectAccessStatus = createSelector(
  [(state) => state.access?.status],
  (status) => status || 'idle'
);
export const selectAccessError = createSelector(
  [(state) => state.access?.error],
  (error) => error || null
);
export const selectAccessLastFetched = createSelector(
  [(state) => state.access?.lastFetched],
  (lastFetched) => lastFetched || null
);

export default accessSlice.reducer;
