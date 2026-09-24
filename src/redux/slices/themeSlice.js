import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
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

// Async thunk to fetch organization theme settings
export const fetchTheme = createAsyncThunk(
  "theme/fetchTheme",
  async (_, { rejectWithValue }) => {
    try {
      const settings = await fetchOrganizationSettings();
      const themeData = settings?.theme || DEFAULT_THEME;
      applyThemeToCssVariables(themeData);
      return themeData;
    } catch (err) {
      applyThemeToCssVariables(DEFAULT_THEME);
      return rejectWithValue(err.message || "Failed to load theme");
    }
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
      return updatedTheme;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save theme settings");
    }
  }
);

const initialState = {
  theme: { ...DEFAULT_THEME },
  previewTheme: { ...DEFAULT_THEME },
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setPreviewColor: (state, action) => {
      const { key, value } = action.payload || {};
      if (key && Object.prototype.hasOwnProperty.call(DEFAULT_THEME, key)) {
        state.previewTheme[key] = value;
        applyThemeToCssVariables(state.previewTheme);
      }
    },
    setFullPreviewTheme: (state, action) => {
      state.previewTheme = { ...DEFAULT_THEME, ...(action.payload || {}) };
      applyThemeToCssVariables(state.previewTheme);
    },
    resetPreviewToSaved: (state) => {
      state.previewTheme = { ...state.theme };
      applyThemeToCssVariables(state.theme);
    },
    resetToDefaultTheme: (state) => {
      state.previewTheme = { ...DEFAULT_THEME };
      applyThemeToCssVariables(DEFAULT_THEME);
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
        state.theme = { ...DEFAULT_THEME };
        state.previewTheme = { ...DEFAULT_THEME };
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
        // Revert live preview back to active persisted theme on save failure
        applyThemeToCssVariables(state.theme);
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

export default themeSlice.reducer;
