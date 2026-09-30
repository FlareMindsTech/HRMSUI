import { createSlice, createAsyncThunk, createAction, createSelector } from '@reduxjs/toolkit';
import { getAssets } from '../../services/assetService';

// Shared asset inventory (GET /asset/all) previously fetched independently by
// AssetManagement-adjacent flows and HR Onboarding (both issued the same
// full-list read). Centralizing the full-list read here removes the
// duplicated requests while keeping every page-local concern — server-side
// pagination/filtering in AssetManagement, search, assignment forms, modals,
// validation and mutation loading flags — in local component state.
//
// Normalization: entities store the full asset objects exactly as the API
// returns them (same fields and IDs each page received before); ids
// preserves server order. Per-candidate assignment collections
// (fetchOnboardingAssets/detailAssets) and per-page query results stay out.
// Available assets are DERIVED via selectAvailableAssets — never stored.

const INVENTORY_TTL_MS = 5 * 60 * 1000;
const INVENTORY_LIMIT = 100;

const getAssetId = (asset) => String(asset?._id || asset?.id || '');

// Canonical array extraction covering the observed body shapes
// (raw array or { data: [...] } with pagination metadata alongside).
export const extractInventoryList = (body) => {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return [];
};

const initialState = {
  ids: [],
  entities: {},
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  lastFetched: null,
  // Identity of the newest in-flight request; stale responses are dropped
  // against it so a slow earlier fetch can never overwrite newer results.
  activeRequest: null,
};

// Fetch the full shared inventory. Resolves with the raw body; normalization
// happens once in the fulfilled reducer so ids/entities can never drift.
export const fetchInventory = createAsyncThunk(
  'assets/fetchInventory',
  async ({ force = false } = {}, { rejectWithValue }) => {
    try {
      const body = await getAssets({ limit: INVENTORY_LIMIT });
      return {
        body: body || [],
        // Timestamp is produced here in the thunk (side-effect-capable layer)
        // so the reducer stays a pure state transition.
        fetchedAt: Date.now(),
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load asset inventory');
    }
  },
  {
    // Skip duplicate in-flight work and honor the TTL cache. `force: true`
    // (used after mutations that change membership/availability) bypasses.
    condition: ({ force = false } = {}, { getState }) => {
      if (force) return true;
      const s = getState().assets;
      if (!s) return true;
      if (s.status === 'loading') return false;
      if (s.lastFetched && Date.now() - s.lastFetched < INVENTORY_TTL_MS) {
        return false;
      }
      return true;
    },
  }
);

// Mark the inventory stale after a mutation. Data is retained for
// stale-while-revalidate (no flash-of-empty); the next guarded fetch
// refreshes it. No unrelated resources are touched.
export const invalidateInventory = createAction('assets/invalidateInventory');

export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    clearAssetsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.activeRequest = action.meta.requestId;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        // Drop stale responses: only the newest request may paint.
        if (state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'succeeded';
        const list = extractInventoryList(action.payload.body);
        state.ids = list.map(getAssetId).filter(Boolean);
        state.entities = {};
        for (const asset of list) {
          const id = getAssetId(asset);
          if (id) state.entities[id] = asset;
        }
        state.error = null;
        if (action.payload.fetchedAt !== undefined) {
          state.lastFetched = action.payload.fetchedAt;
        }
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        // A condition-guard skip also lands here (meta.condition); it must
        // not clobber healthy cached data, so only record genuine errors.
        if (action.meta?.condition) return;
        if (state.activeRequest && state.activeRequest !== action.meta.requestId) return;
        state.activeRequest = null;
        state.status = 'failed';
        state.error = action.payload || 'Failed to load asset inventory';
      })
      .addCase(invalidateInventory, (state) => {
        state.status = 'idle';
        state.error = null;
        state.lastFetched = null;
      });
  },
});

export const { clearAssetsError } = assetsSlice.actions;

// ---- Selectors (field-level inputs: each selector recomputes ONLY when
// its own field changes, never on unrelated status/error/identity churn) ----
const selectAssetIds = (state) => state.assets?.ids;
const selectAssetEntities = (state) => state.assets?.entities;

// Canonical inventory array in server order (full objects, same fields/IDs).
export const selectAllAssets = createSelector(
  [selectAssetIds, selectAssetEntities],
  (ids, entities) => (ids || []).map((id) => entities?.[id]).filter(Boolean)
);

export const selectAssetById = (state, id) =>
  state?.assets?.entities?.[String(id)] || null;

// Derived — never stored: available assets come from the canonical inventory.
export const selectAvailableAssets = createSelector([selectAllAssets], (list) =>
  list.filter((a) => a?.status === 'AVAILABLE')
);

export const selectAssetsCount = createSelector(
  [selectAssetIds],
  (ids) => ids?.length || 0
);
export const selectAssetsStatus = createSelector(
  [(state) => state.assets?.status],
  (status) => status || 'idle'
);
export const selectAssetsError = createSelector(
  [(state) => state.assets?.error],
  (error) => error || null
);
export const selectAssetsLastFetched = createSelector(
  [(state) => state.assets?.lastFetched],
  (lastFetched) => lastFetched || null
);

export default assetsSlice.reducer;
