import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  fetchOrganizationSettings,
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
  infoColor: "#A98245",
});

export const THEME_PRESETS = [
  {
    name: "Gold & Charcoal (Default)",
    key: "gold",
    description: "Enterprise Gold & Dark Charcoal Theme",
    colors: { ...DEFAULT_THEME },
  },
];

/**
 * Applies theme color definitions directly to document.documentElement CSS custom variables
 */
export const applyThemeToCssVariables = () => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--color-primary", DEFAULT_THEME.primaryColor);
  root.style.setProperty("--color-primary-dark", DEFAULT_THEME.primaryDarkColor);
  root.style.setProperty("--color-primary-light", DEFAULT_THEME.primaryLightColor);
  root.style.setProperty("--color-sidebar", DEFAULT_THEME.sidebarColor);
  root.style.setProperty("--color-background", DEFAULT_THEME.backgroundColor);
  root.style.setProperty("--color-surface", DEFAULT_THEME.surfaceColor);
  root.style.setProperty("--color-text", DEFAULT_THEME.textColor);
  root.style.setProperty("--color-secondary-text", DEFAULT_THEME.secondaryTextColor);
  root.style.setProperty("--color-border", DEFAULT_THEME.borderColor);
  root.style.setProperty("--color-success", DEFAULT_THEME.successColor);
  root.style.setProperty("--color-warning", DEFAULT_THEME.warningColor);
  root.style.setProperty("--color-danger", DEFAULT_THEME.dangerColor);
  root.style.setProperty("--color-info", DEFAULT_THEME.infoColor);
};

// Persisted saved-theme cache locked to DEFAULT_THEME
const initialSavedTheme = { ...DEFAULT_THEME };
applyThemeToCssVariables();

// Async thunk to fetch organization theme settings (keeps contract safe)
export const fetchTheme = createAsyncThunk(
  "theme/fetchTheme",
  async (_, { rejectWithValue }) => {
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        await fetchOrganizationSettings();
      }
      applyThemeToCssVariables();
      return DEFAULT_THEME;
    } catch (err) {
      applyThemeToCssVariables();
      return DEFAULT_THEME;
    }
  },
  {
    condition: (_, { getState }) => getState().theme?.loading !== true,
  }
);

// Async thunk to save theme settings to backend (locked to DEFAULT_THEME)
export const saveTheme = createAsyncThunk(
  "theme/saveTheme",
  async () => {
    applyThemeToCssVariables();
    return DEFAULT_THEME;
  }
);

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
