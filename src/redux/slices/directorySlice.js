import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchAllUsers } from '../../services/rbacService';

// Shared employee/user directory (GET /user/get?limit=100) previously
// fetched independently by UserManagement, HrOnboarding, Education,
// Documents, Assets and OrgAccessManagement. Centralizing here removes the
// duplicated requests while keeping every page-local concern — search,
// filter, pagination, sorting, selection, forms, modals, validation and
// page loading flags — in local component state.
//
// Normalization: entities store the full employee objects exactly as the
// API returns them (same fields and IDs each page received before); ids
// preserves server order. Per-user detail collections (access config,
// documents, education records, onboarding details) do NOT belong here.

const DIRECTORY_TTL_MS = 5 * 60 * 1000;

const getEmployeeId = (emp) => String(emp?._id || emp?.id || '');

// Canonical array extraction covering the payload shapes observed across
// callers (raw array, { users: [] }, { data: [] }).
export const extractDirectoryList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.users)) return payload.users;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const initialState = {
  // Raw service payload, kept so callers with legacy unwraps observe the
  // exact values they received before (see selectDirectoryPayload).
  payload: null,
  ids: [],
  entities: {},
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  lastFetched: null,
  // Identity of the newest in-flight request; stale responses are dropped
  // against it so a slow earlier fetch can never overwrite newer results.
  activeRequest: null,
};

// Fetch the directory. Resolves with the raw payload; normalization happens
// once in the fulfilled reducer so ids/entities can never drift apart.
export const fetchDirectory = createAsyncThunk(
  'directory/fetchDirectory',
  async ({ force = false } = {}, { rejectWithValue }) => {
    try {
      const payload = await fetchAllUsers();
      return {
        payload: payload || [],
        // Timestamp is produced here in the thunk (side-effect-capable layer)
        // so the reducer stays a pure state transition.
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load employee directory');
    }
  },
  {
    // Skip duplicate in-flight work and honor the TTL cache. `force: true`
    // (used after provisioning / role / status mutations) bypasses both.
    condition: ({ force = false } = {}, { getState }) => {
      if (force) return true;
      const s = getState().directory;
      if (!s) return true;
      if (s.status === 'loading') return false;
      if (s.lastFetched && Date.now() - s.lastFetched < DIRECTORY_TTL_MS) {
        return false;
      }
      return true;
    },
  }
);

export const directorySlice = createSlice({
  name: 'directory',
  initialState,
  reducers: {
    clearDirectoryError: (state) => {
      state.error = null;
    },
    // Drop the cache (e.g. on logout-adjacent flows owned by auth).
    clearDirectory: (state) => {
      state.payload = null;
      state.ids = [];
      state.entities = {};
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
      state.activeRequest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDirectory.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.activeRequest = action.meta.requestId;
      })
      .addCase(fetchDirectory.fulfilled, (state, action) => {
        // Drop stale responses: only the newest request may paint.
        if (state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'succeeded';
        state.payload = action.payload.payload;
        const list = extractDirectoryList(action.payload.payload);
        state.ids = list.map(getEmployeeId).filter(Boolean);
        state.entities = {};
        for (const emp of list) {
          const id = getEmployeeId(emp);
          if (id) state.entities[id] = emp;
        }
        state.error = null;
        if (action.payload.fetchedAt !== undefined) {
          state.lastFetched = action.payload.fetchedAt;
        }
      })
      .addCase(fetchDirectory.rejected, (state, action) => {
        // A condition-guard skip also lands here (meta.condition); it must
        // not clobber healthy cached data, so only record genuine errors.
        // Likewise, a stale request's failure must not clear the newer
        // request's loading state or results.
        if (action.meta?.condition) return;
        if (state.activeRequest && state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'failed';
        state.error = action.payload || 'Failed to load employee directory';
      });
  },
});

export const { clearDirectoryError, clearDirectory } = directorySlice.actions;

// ---- Selectors (field-level inputs: each selector recomputes ONLY when
// its own field changes, never on unrelated status/error/identity churn) ----
const selectDirectoryIds = (state) => state.directory?.ids;
const selectDirectoryEntities = (state) => state.directory?.entities;

// Raw payload for callers with legacy unwraps (e.g. payload?.data || []).
export const selectDirectoryPayload = createSelector(
  [(state) => state.directory?.payload],
  (payload) => payload || []
);

// Canonical employee array in server order (full objects, same fields/IDs).
export const selectAllEmployees = createSelector(
  [selectDirectoryIds, selectDirectoryEntities],
  (ids, entities) => (ids || []).map((id) => entities?.[id]).filter(Boolean)
);

export const selectEmployeeById = (state, id) =>
  state?.directory?.entities?.[String(id)] || null;

export const selectDirectoryCount = createSelector(
  [selectDirectoryIds],
  (ids) => ids?.length || 0
);
export const selectDirectoryStatus = createSelector(
  [(state) => state.directory?.status],
  (status) => status || 'idle'
);
export const selectDirectoryError = createSelector(
  [(state) => state.directory?.error],
  (error) => error || null
);
export const selectDirectoryLastFetched = createSelector(
  [(state) => state.directory?.lastFetched],
  (lastFetched) => lastFetched || null
);

export default directorySlice.reducer;
