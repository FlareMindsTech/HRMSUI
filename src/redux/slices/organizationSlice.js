import {
  createSlice,
  createAsyncThunk,
  createAction,
  createSelector,
} from '@reduxjs/toolkit';
import {
  fetchMyOrganization,
  fetchOrganizationStructure,
  fetchReportingTree,
  fetchOrganizationSettings,
  fetchDepartmentsDropdown,
  fetchShiftsDropdown,
  fetchWorkCalendarsDropdown,
  fetchHolidayCalendarsDropdown,
} from '../../services/organizationService';
import { fetchAttendanceSettings } from '../../Api/Attendance/attendance';

// Shared organization server/master data previously fetched independently by
// every consumer (Organisation page, OrgOverview, OrganizationProfileView,
// EditOrgProfilePage, SubscriptionSection, OrganizationSettingsSection,
// BranchesSection, BranchSettingsSection, Attendance). Centralizing the
// no-arg shared reads here removes the duplicated requests while keeping
// every page-local concern — forms, filters, pagination, modals, validation,
// scoped (branchId-parametrized) reads and mutation loading flags — local.
//
// Ownership boundaries (do not move):
// - branches / selectedBranchId / branch selection stay in BranchContext.
// - theme stays in themeSlice (it fetches settings independently).
// - per-user access, documents, education and onboarding details stay out.
//
// Each resource is fetched only when a migrated caller asks for it (never
// bulk-fetched), with per-resource status/error/lastFetched. Response shapes
// are preserved exactly (raw service returns); derivation stays in callers.

const ORG_TTL_MS = 5 * 60 * 1000;

const RESOURCE_FETCHERS = {
  // Canonical organization flow (GET /organization/me + list fallback lives
  // inside the service — no endpoint guessing is added or removed here).
  profile: () => fetchMyOrganization(true),
  structure: fetchOrganizationStructure,
  // No-arg only; branchId-scoped tree reads stay direct service calls.
  reportingTree: () => fetchReportingTree(),
  settings: fetchOrganizationSettings,
  // Default scope only; owner-selected-org reads stay direct service calls.
  attendancePolicy: () => fetchAttendanceSettings(),
  // No-arg dropdowns only; branchId-scoped reads stay direct service calls.
  departments: () => fetchDepartmentsDropdown(),
  shifts: fetchShiftsDropdown,
  workCalendars: fetchWorkCalendarsDropdown,
  holidayCalendars: fetchHolidayCalendarsDropdown,
};

const emptyResource = () => ({ data: null, status: 'idle', error: null, lastFetched: null });

const initialState = {
  resources: {},
  // Newest in-flight request id per resource key; stale responses are
  // dropped against it so a slow earlier fetch can never overwrite newer
  // results for the same resource.
  activeRequests: {},
};

// Fetch one resource by key. Resolves with the raw service payload;
// normalization/derivation stays with the existing callers.
export const fetchOrgResource = createAsyncThunk(
  'organization/fetchResource',
  async ({ key, force = false } = {}, { rejectWithValue }) => {
    const fetcher = RESOURCE_FETCHERS[key];
    if (!fetcher) return rejectWithValue(`Unknown organization resource: ${key}`);
    try {
      const data = await fetcher();
      return {
        key,
        data: data ?? null,
        // Timestamp is produced here in the thunk (side-effect-capable layer)
        // so the reducer stays a pure state transition.
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || `Failed to load ${key}`);
    }
  },
  {
    // Skip duplicate in-flight work and honor the per-resource TTL cache.
    // `force: true` (used after mutations) bypasses both guards.
    condition: ({ key, force = false } = {}, { getState }) => {
      if (force) return true;
      const r = getState().organization?.resources?.[key];
      if (!r) return true;
      if (r.status === 'loading') return false;
      if (r.lastFetched && Date.now() - r.lastFetched < ORG_TTL_MS) {
        return false;
      }
      return true;
    },
  }
);

// Mark resource(s) stale after a mutation. Data is retained for
// stale-while-revalidate (no flash-of-empty); the next guarded fetch
// refreshes it. Accepts a single key or an array of keys.
export const invalidateOrgResource = createAction(
  'organization/invalidateResource'
);

export const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    clearOrganizationError: (state, action) => {
      const key = action.payload;
      if (key && state.resources[key]) {
        state.resources[key].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgResource.pending, (state, action) => {
        const key = action.meta.arg.key;
        if (!state.resources[key]) state.resources[key] = emptyResource();
        state.resources[key].status = 'loading';
        state.resources[key].error = null;
        state.activeRequests[key] = action.meta.requestId;
      })
      .addCase(fetchOrgResource.fulfilled, (state, action) => {
        const { key, data, fetchedAt } = action.payload;
        // Drop stale responses: only the newest request per key may paint.
        if (state.activeRequests[key] !== action.meta.requestId) return;
        delete state.activeRequests[key];
        if (!state.resources[key]) state.resources[key] = emptyResource();
        state.resources[key].status = 'succeeded';
        state.resources[key].data = data;
        state.resources[key].error = null;
        if (fetchedAt !== undefined) state.resources[key].lastFetched = fetchedAt;
      })
      .addCase(fetchOrgResource.rejected, (state, action) => {
        // A condition-guard skip also lands here (meta.condition); it must
        // not clobber healthy cached data, so only record genuine errors.
        // Likewise, a stale request's failure must not clear the newer
        // request's loading state or results.
        if (action.meta?.condition) return;
        const key = action.meta.arg.key;
        if (!key) return;
        if (state.activeRequests[key] && state.activeRequests[key] !== action.meta.requestId) {
          return;
        }
        delete state.activeRequests[key];
        if (!state.resources[key]) state.resources[key] = emptyResource();
        state.resources[key].status = 'failed';
        state.resources[key].error = action.payload || `Failed to load ${key}`;
      })
      .addCase(invalidateOrgResource, (state, action) => {
        const keys = Array.isArray(action.payload) ? action.payload : [action.payload];
        for (const key of keys) {
          if (state.resources[key]) {
            state.resources[key].status = 'idle';
            state.resources[key].error = null;
            state.resources[key].lastFetched = null;
          }
          // Drop in-flight responses for invalidated keys so a stale fetch
          // resolving after the mutation cannot repaint with old data.
          delete state.activeRequests[key];
        }
      });
  },
});

export const { clearOrganizationError } = organizationSlice.actions;

// ---- Selectors (per-key inputs: each selector recomputes ONLY when its
// own resource changes, never when an unrelated resource loads) ----
const selectOrgResources = (state) => state.organization?.resources || {};

// Raw resource payload (same shape the service returns today).
export const selectOrgResource = (state, key) =>
  selectOrgResources(state)[key]?.data ?? null;
export const selectOrgResourceStatus = (state, key) =>
  selectOrgResources(state)[key]?.status || 'idle';
export const selectOrgResourceError = (state, key) =>
  selectOrgResources(state)[key]?.error || null;

const pickData = (key) => [
  (state) => state.organization?.resources?.[key],
  (ref) => ref?.data ?? null,
];
const pickList = (key) => [
  (state) => state.organization?.resources?.[key],
  (ref) =>
    ref?.data === undefined || ref?.data === null ? [] : ref.data,
];

export const selectOrgProfile = createSelector(...pickData('profile'));
export const selectOrgStructure = createSelector(...pickData('structure'));
export const selectOrgReportingTree = createSelector(...pickData('reportingTree'));
export const selectOrgSettings = createSelector(...pickData('settings'));
export const selectAttendancePolicy = createSelector(...pickData('attendancePolicy'));
export const selectDepartmentsDropdown = createSelector(...pickList('departments'));
export const selectShiftsDropdown = createSelector(...pickList('shifts'));
export const selectWorkCalendarsDropdown = createSelector(...pickList('workCalendars'));
export const selectHolidayCalendarsDropdown = createSelector(...pickList('holidayCalendars'));

export default organizationSlice.reducer;
