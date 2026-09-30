import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  fetchOrganizationSettings,
  updateOrganizationSettings as updateOrgSettingsApi,
} from "../../services/organizationService";

export const DEFAULT_THEME = Object.freeze({
  primaryColor: "#C79D58",
  primaryDarkColor: "#A98245",
  primaryLightColor: "#F1E8D6",
  sidebarColor: "#1C1D1D",
  backgroundColor: "#F7F5F0",
  surfaceColor: "#FFFFFF",
  textColor: "#1C1D1D",
  secondaryTextColor: "#77736B",
  borderColor: "#E5E0D7",
  successColor: "#2E7D32",
  warningColor: "#ED9F24",
  dangerColor: "#D64545",
  infoColor: "#3B82F6",
});

export const THEME_PRESETS = [
  {
    name: "Gold (Default)",
    key: "gold",
    description: "Classic HRMS Gold & Dark Charcoal Enterprise Theme",
    colors: { ...DEFAULT_THEME },
  },
  {
    name: "Ocean Blue",
    key: "ocean-blue",
    description: "Modern Sapphire & Navy Corporate Palette",
    colors: {
      primaryColor: "#2563EB",
      primaryDarkColor: "#1D4ED8",
      primaryLightColor: "#DBEAFE",
      sidebarColor: "#0F172A",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      textColor: "#0F172A",
      secondaryTextColor: "#64748B",
      borderColor: "#E2E8F0",
      successColor: "#16A34A",
      warningColor: "#D97706",
      dangerColor: "#DC2626",
      infoColor: "#0284C7",
    },
  },
  {
    name: "Emerald",
    key: "emerald",
    description: "Sleek Forest Emerald & Mint Professional Palette",
    colors: {
      primaryColor: "#059669",
      primaryDarkColor: "#047857",
      primaryLightColor: "#D1FAE5",
      sidebarColor: "#064E3B",
      backgroundColor: "#F0FDF4",
      surfaceColor: "#FFFFFF",
      textColor: "#064E3B",
      secondaryTextColor: "#4B5563",
      borderColor: "#E5E7EB",
      successColor: "#10B981",
      warningColor: "#F59E0B",
      dangerColor: "#EF4444",
      infoColor: "#3B82F6",
    },
  },
  {
    name: "Royal Purple",
    key: "royal-purple",
    description: "Luxury Violet & Deep Obsidian Theme",
    colors: {
      primaryColor: "#7C3AED",
      primaryDarkColor: "#6D28D9",
      primaryLightColor: "#EDE9FE",
      sidebarColor: "#1E1B4B",
      backgroundColor: "#FAF5FF",
      surfaceColor: "#FFFFFF",
      textColor: "#1E1B4B",
      secondaryTextColor: "#6B7280",
      borderColor: "#E5E7EB",
      successColor: "#10B981",
      warningColor: "#F59E0B",
      dangerColor: "#EF4444",
      infoColor: "#3B82F6",
    },
  },
];

/**
 * Applies theme color definitions directly to document.documentElement CSS custom variables
 */
export const applyThemeToCssVariables = (themeObj = {}) => {
  if (typeof document === "undefined") return;
  const theme = { ...DEFAULT_THEME, ...(themeObj || {}) };
  const root = document.documentElement;

  root.style.setProperty("--color-primary", theme.primaryColor || DEFAULT_THEME.primaryColor);
  root.style.setProperty("--color-primary-dark", theme.primaryDarkColor || DEFAULT_THEME.primaryDarkColor);
  root.style.setProperty("--color-primary-light", theme.primaryLightColor || DEFAULT_THEME.primaryLightColor);
  root.style.setProperty("--color-sidebar", theme.sidebarColor || DEFAULT_THEME.sidebarColor);
  root.style.setProperty("--color-background", theme.backgroundColor || DEFAULT_THEME.backgroundColor);
  root.style.setProperty("--color-surface", theme.surfaceColor || DEFAULT_THEME.surfaceColor);
  root.style.setProperty("--color-text", theme.textColor || DEFAULT_THEME.textColor);
  root.style.setProperty("--color-secondary-text", theme.secondaryTextColor || DEFAULT_THEME.secondaryTextColor);
  root.style.setProperty("--color-border", theme.borderColor || DEFAULT_THEME.borderColor);
  root.style.setProperty("--color-success", theme.successColor || DEFAULT_THEME.successColor);
  root.style.setProperty("--color-warning", theme.warningColor || DEFAULT_THEME.warningColor);
  root.style.setProperty("--color-danger", theme.dangerColor || DEFAULT_THEME.dangerColor);
  root.style.setProperty("--color-info", theme.infoColor || DEFAULT_THEME.infoColor);
};

// Persisted saved-theme cache so a refresh paints the last saved theme
// instantly (before the server revalidation lands) instead of flashing the
// default. Preview (unsaved) state is intentionally never persisted —
// refreshing after preview-without-save correctly restores the saved theme.
const THEME_STORAGE_KEY = "hrms_org_theme";

const readCachedTheme = () => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.primaryColor === "string") return parsed;
  } catch {
    // Corrupt cache: fall through to defaults below.
  }
  return null;
};

const persistTheme = (themeObj) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeObj));
  } catch {
    // ignore storage errors — server remains the source of truth
  }
};

// Async thunk to fetch organization theme settings
export const fetchTheme = createAsyncThunk(
  "theme/fetchTheme",
  async (_, { rejectWithValue }) => {
    try {
      const settings = await fetchOrganizationSettings();
      const themeData = settings?.theme || DEFAULT_THEME;
      applyThemeToCssVariables(themeData);
      // Only persist when the server actually returned a theme: a response
      // without one must not wipe a previously saved cache.
      if (settings?.theme) persistTheme(themeData);
      return themeData;
    } catch (err) {
      // Keep whatever is currently applied (boot cache or live preview):
      // a transient failure must not clobber the theme back to default.
      return rejectWithValue(err.message || "Failed to load theme");
    }
  },
  {
    // Collapse concurrent mount dispatches (Layout + editor, StrictMode
    // remounts) into a single request. Genuine reloads dispatch after the
    // in-flight one settles.
    condition: (_, { getState }) => getState().theme?.loading !== true,
  }
);

// Async thunk to save theme settings to backend
export const saveTheme = createAsyncThunk(
  "theme/saveTheme",
  async (themePayload, { rejectWithValue }) => {
    try {
      const response = await updateOrgSettingsApi({ theme: themePayload });
      const updatedTheme = response?.data?.theme || themePayload;
      applyThemeToCssVariables(updatedTheme);
      persistTheme(updatedTheme);
      return updatedTheme;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save theme settings");
    }
  },
  {
    // Drop double-submit saves while one is in flight; the first save wins.
    condition: (_, { getState }) => getState().theme?.saving !== true,
  }
);

const cachedTheme = readCachedTheme();
const initialSavedTheme = cachedTheme
  ? { ...DEFAULT_THEME, ...cachedTheme }
  : { ...DEFAULT_THEME };

// Apply the cached saved theme synchronously at module load (before first
// paint) so refresh never flashes the default. Mirrors the auth module's
// storage hydration; no reducer is involved.
applyThemeToCssVariables(initialSavedTheme);

const initialState = {
  theme: { ...initialSavedTheme },
  previewTheme: { ...initialSavedTheme },
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    // Pure state transitions only. DOM CSS-variable updates live in the
    // thunks (fetch/save paths) and in the editor's preview effect, never
    // in reducers — reducers must stay free of DOM side effects so they
    // remain deterministic under time-travel and StrictMode re-invocation.
    setPreviewColor: (state, action) => {
      const { key, value } = action.payload || {};
      if (key && Object.prototype.hasOwnProperty.call(DEFAULT_THEME, key)) {
        state.previewTheme[key] = value;
      }
    },
    setFullPreviewTheme: (state, action) => {
      state.previewTheme = { ...DEFAULT_THEME, ...(action.payload || {}) };
    },
    resetPreviewToSaved: (state) => {
      state.previewTheme = { ...state.theme };
    },
    resetToDefaultTheme: (state) => {
      state.previewTheme = { ...DEFAULT_THEME };
    },
    clearThemeStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Theme
      .addCase(fetchTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.theme = { ...DEFAULT_THEME, ...action.payload };
        state.previewTheme = { ...state.theme };
      })
      .addCase(fetchTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Preserve the current (cached/live) theme on failure — resetting to
        // defaults here is what used to flash gold after a transient error.
      })
      // Save Theme
      .addCase(saveTheme.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(saveTheme.fulfilled, (state, action) => {
        state.saving = false;
        state.theme = { ...DEFAULT_THEME, ...action.payload };
        state.previewTheme = { ...state.theme };
        state.successMessage = "Organization theme saved and applied successfully!";
      })
      .addCase(saveTheme.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
        // The editor's preview effect re-applies state.theme to the DOM when
        // previewTheme resets here — no direct DOM write in the reducer.
        state.previewTheme = { ...state.theme };
      });
  },
});

export const {
  setPreviewColor,
  setFullPreviewTheme,
  resetPreviewToSaved,
  resetToDefaultTheme,
  clearThemeStatus,
} = themeSlice.actions;

// ---- Focused selectors with field-level inputs (each recomputes ONLY
// when its own field changes, never on unrelated loading/saving churn;
// prefer these over selecting the whole slice) ----
export const selectTheme = createSelector(
  [(state) => state.theme?.theme],
  (theme) => theme || { ...DEFAULT_THEME }
);
export const selectPreviewTheme = createSelector(
  [(state) => state.theme?.previewTheme],
  (previewTheme) => previewTheme || { ...DEFAULT_THEME }
);
export const selectThemeLoading = createSelector(
  [(state) => state.theme?.loading],
  (loading) => loading === true
);
export const selectThemeSaving = createSelector(
  [(state) => state.theme?.saving],
  (saving) => saving === true
);
export const selectThemeError = createSelector(
  [(state) => state.theme?.error],
  (error) => error || null
);
export const selectThemeSuccessMessage = createSelector(
  [(state) => state.theme?.successMessage],
  (successMessage) => successMessage || null
);

export default themeSlice.reducer;
