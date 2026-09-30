import { createSlice, createAsyncThunk, createAction, createSelector } from '@reduxjs/toolkit';
import { fetchOnboardings } from '../../Api/Hr/hr';

// Shared onboarding pipeline/list server state (GET /onboarding/all with
// status/search params) previously fetched and refetched by HR Onboarding on
// every keystroke-adjacent render. Centralizing the list here removes the
// duplicated requests while keeping every UI concern — debounced search
// input, status filter, pagination, selection, workspace/detail data, forms,
// files, tabs, modals, previews, tasks, access, training, agreements,
// validation and loading flags — in local component state.
//
// Normalization: entities store the full pipeline records exactly as the API
// returns them (same fields and IDs the page received before); ids preserves
// server order. The workspace/detail collections (selected record, documents,
// tasks, assets, access, training, agreements, validation) do NOT belong
// here — only the shared list.

const PIPELINE_TTL_MS = 5 * 60 * 1000;

const getRecordId = (rec) => String(rec?._id || rec?.id || '');

// Canonical list extraction mirroring the page's previous unwrap contract
// (raw array or { data: [...] }).
export const extractPipelineList = (body) => {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return [];
};

const sameParams = (a, b) =>
  (a?.status || '') === (b?.status || '') && (a?.search || '') === (b?.search || '');

const initialState = {
  ids: [],
  entities: {},
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  lastFetched: null,
  // Identity of the newest in-flight request; stale responses are dropped
  // against it so a slow earlier search can never overwrite newer results.
  activeRequest: null,
  // Params of the last successfully loaded list (for identical-params TTL).
  lastParams: null,
};

// Fetch the pipeline list for the given server filter params. Resolves with
// the raw records; normalization happens once in the fulfilled reducer so
// ids/entities can never drift apart.
export const fetchPipeline = createAsyncThunk(
  'onboarding/fetchPipeline',
  async ({ status = '', search = '', force = false } = {}, { rejectWithValue }) => {
    try {
      const res = await fetchOnboardings({ status, search });
      return {
        records: extractPipelineList(res?.data ?? res),
        params: { status, search },
        // Timestamp is produced here in the thunk (side-effect-capable layer)
        // so the reducer stays a pure state transition.
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load onboarding pipeline');
    }
  },
  {
    // Duplicate-request protection: skip when the identical request is
    // already in flight, and when identical params resolved within the TTL.
    // `force: true` (used after pipeline-changing mutations and explicit
    // refresh) bypasses both guards. Differing params always proceed — their
    // ordering is resolved by request identity in the reducers below.
    condition: ({ status = '', search = '', force = false } = {}, { getState }) => {
      if (force) return true;
      const s = getState().onboarding;
      if (!s) return true;
      const params = { status, search };
      if (s.status === 'loading' && s.activeRequest && sameParams(s.activeRequest, params)) {
        return false;
      }
      if (
        s.lastParams &&
        sameParams(s.lastParams, params) &&
        s.lastFetched &&
        Date.now() - s.lastFetched < PIPELINE_TTL_MS
      ) {
        return false;
      }
      return true;
    },
  }
);

// Mark the pipeline stale after a mutation. Data is retained for
// stale-while-revalidate (no flash-of-empty); the next guarded fetch
// refreshes it. Mutation sites in practice pass `force: true` instead for a
// single round-trip; this action covers cross-component invalidation.
export const invalidatePipeline = createAction('onboarding/invalidatePipeline');

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    clearOnboardingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPipeline.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.activeRequest = {
          requestId: action.meta.requestId,
          status: action.meta.arg.status || '',
          search: action.meta.arg.search || '',
        };
      })
      .addCase(fetchPipeline.fulfilled, (state, action) => {
        // Drop stale responses: only the newest request may paint.
        if (state.activeRequest?.requestId !== action.meta.requestId) return;
        state.status = 'succeeded';
        const list = action.payload.records;
        state.ids = list.map(getRecordId).filter(Boolean);
        state.entities = {};
        for (const rec of list) {
          const id = getRecordId(rec);
          if (id) state.entities[id] = rec;
        }
        state.error = null;
        state.lastParams = action.payload.params;
        state.activeRequest = null;
        if (action.payload.fetchedAt !== undefined) {
          state.lastFetched = action.payload.fetchedAt;
        }
      })
      .addCase(fetchPipeline.rejected, (state, action) => {
        // A condition-guard skip also lands here (meta.condition); it must
        // not clear a newer loading state or cached data, so it is ignored.
        // Likewise, a stale request's failure must not clobber the newer
        // request's loading state or results.
        if (action.meta?.condition) return;
        if (
          state.activeRequest &&
          state.activeRequest.requestId !== action.meta.requestId
        ) {
          return;
        }
        state.status = 'failed';
        state.error = action.payload || 'Failed to load onboarding pipeline';
        state.activeRequest = null;
      })
      .addCase(invalidatePipeline, (state) => {
        state.status = 'idle';
        state.error = null;
        state.lastFetched = null;
        state.lastParams = null;
        state.activeRequest = null;
      });
  },
});

export const { clearOnboardingError } = onboardingSlice.actions;

// ---- Selectors (field-level inputs: each selector recomputes ONLY when
// its own field changes, never on unrelated status/error/identity churn) ----
const selectPipelineIds = (state) => state.onboarding?.ids;
const selectPipelineEntities = (state) => state.onboarding?.entities;

// Canonical pipeline array in server order (full records, same fields/IDs).
export const selectPipelineList = createSelector(
  [selectPipelineIds, selectPipelineEntities],
  (ids, entities) => (ids || []).map((id) => entities?.[id]).filter(Boolean)
);

export const selectPipelineRecordById = (state, id) =>
  state?.onboarding?.entities?.[String(id)] || null;

// Derived — never stored: the UI paginates client-side over the full list.
export const selectPipelineTotal = createSelector(
  [selectPipelineIds],
  (ids) => ids?.length || 0
);
export const selectPipelineStatus = createSelector(
  [(state) => state.onboarding?.status],
  (status) => status || 'idle'
);
export const selectPipelineError = createSelector(
  [(state) => state.onboarding?.error],
  (error) => error || null
);
export const selectPipelineLastFetched = createSelector(
  [(state) => state.onboarding?.lastFetched],
  (lastFetched) => lastFetched || null
);

export default onboardingSlice.reducer;
