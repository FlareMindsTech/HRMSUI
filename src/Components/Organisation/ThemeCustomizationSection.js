import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FaPalette,
  FaSave,
  FaUndo,
  FaCheck,
  FaExclamationTriangle,
  FaEye,
  FaSlidersH,
} from "react-icons/fa";
import {
  setPreviewColor,
  setFullPreviewTheme,
  saveTheme,
  resetPreviewToSaved,
  resetToDefaultTheme,
  clearThemeStatus,
  DEFAULT_THEME,
  THEME_PRESETS,
  fetchTheme,
} from "../../redux/slices/themeSlice";
import { useAuth } from "../../context/AuthContext";
import "./ThemeCustomizationSection.css";

const COLOR_METADATA = [
  {
    key: "primaryColor",
    label: "Primary Color",
    description: "Main brand color used for primary buttons, active highlights, and key icons.",
  },
  {
    key: "primaryDarkColor",
    label: "Primary Dark Color",
    description: "Darker accent shade used for hover states and subtle gradients.",
  },
  {
    key: "primaryLightColor",
    label: "Primary Light Color",
    description: "Light cream accent shade used for subtle highlights and badge fills.",
  },
  {
    key: "sidebarColor",
    label: "Sidebar Color",
    description: "Background color of the main navigation sidebar panel.",
  },
  {
    key: "backgroundColor",
    label: "Background Color",
    description: "Global canvas background color behind all content panels.",
  },
  {
    key: "surfaceColor",
    label: "Surface Color",
    description: "Background color for cards, modals, dropdowns, and form containers.",
  },
  {
    key: "textColor",
    label: "Text Color",
    description: "Primary typography color used for headings and main body text.",
  },
  {
    key: "secondaryTextColor",
    label: "Secondary Text Color",
    description: "Muted text color used for subtitles, metadata, and timestamps.",
  },
  {
    key: "borderColor",
    label: "Border Color",
    description: "Standard border color for card dividers, table rows, and form outlines.",
  },
  {
    key: "successColor",
    label: "Success Color",
    description: "Semantic indicator for approved requests, active status, and positive alerts.",
  },
  {
    key: "warningColor",
    label: "Warning Color",
    description: "Semantic indicator for pending actions, grace periods, and caution alerts.",
  },
  {
    key: "dangerColor",
    label: "Danger Color",
    description: "Semantic indicator for rejections, deletions, overdue alerts, and errors.",
  },
  {
    key: "infoColor",
    label: "Info Color",
    description: "Semantic indicator for informative notes, documentation, and help badges.",
  },
];

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function ThemeCustomizationSection() {
  const dispatch = useDispatch();
  const { hasPermission, isSystemAdmin } = useAuth();
  const { theme, previewTheme, loading, saving, error, successMessage } = useSelector(
    (state) => state.theme
  );

  const canUpdate =
    isSystemAdmin ||
    hasPermission("orgSettings.update") ||
    hasPermission("organizationSettings.update");

  useEffect(() => {
    // Ensure theme is loaded from backend if not already present
    if (!theme || Object.keys(theme).length === 0) {
      dispatch(fetchTheme());
    }
  }, [dispatch, theme]);

  const handleColorChange = (key, val) => {
    dispatch(setPreviewColor({ key, value: val }));
  };

  const handleSelectPreset = (presetColors) => {
    if (canUpdate && !saving) {
      dispatch(setFullPreviewTheme(presetColors));
    }
  };

  const handleSave = () => {
    dispatch(clearThemeStatus());
    dispatch(saveTheme(previewTheme));
  };

  const handleResetToSaved = () => {
    dispatch(clearThemeStatus());
    dispatch(resetPreviewToSaved());
  };

  const handleResetToDefault = () => {
    dispatch(clearThemeStatus());
    dispatch(resetToDefaultTheme());
  };

  const isModifiedFromSaved = JSON.stringify(previewTheme) !== JSON.stringify(theme);
  const isModifiedFromDefault = JSON.stringify(previewTheme) !== JSON.stringify(DEFAULT_THEME);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-3 text-muted">Loading organization theme configuration...</p>
      </div>
    );
  }

  return (
    <div className="theme-customization-container">
      {/* ── Section Title ── */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: "var(--color-text)" }}>
            <FaPalette style={{ color: "var(--color-primary)" }} /> Organization Theme Customization
          </h4>
          <p className="text-muted small mb-0">
            Customize the live visual identity and brand colors for your organization across all HRMS modules.
          </p>
        </div>
        {!canUpdate && (
          <Badge bg="secondary" className="px-3 py-2">
            Read-Only (Requires orgSettings.update)
          </Badge>
        )}
      </div>

      {/* ── Status Alerts ── */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => dispatch(clearThemeStatus())}>
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" dismissible onClose={() => dispatch(clearThemeStatus())}>
          <FaCheck className="me-2" />
          {successMessage}
        </Alert>
      )}

      {/* ── Built-in Theme Presets Row ── */}
      <div className="mb-4">
        <h6 className="fw-bold text-xs text-uppercase tracking-wider text-muted mb-2.5 d-flex align-items-center gap-2">
          <FaPalette /> Built-in Theme Presets
        </h6>
        <Row className="g-3">
          {THEME_PRESETS.map((preset) => {
            const isPresetActive =
              preset.colors.primaryColor === previewTheme.primaryColor &&
              preset.colors.sidebarColor === previewTheme.sidebarColor &&
              preset.colors.backgroundColor === previewTheme.backgroundColor;

            return (
              <Col key={preset.key} xs={12} sm={6} lg={3}>
                <div
                  className={`theme-preset-card ${isPresetActive ? "active" : ""}`}
                  onClick={() => handleSelectPreset(preset.colors)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="theme-preset-header">
                    <span className="theme-preset-title">{preset.name}</span>
                    {isPresetActive && (
                      <Badge bg="warning" text="dark" className="text-xs px-2 py-1">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="theme-color-desc mb-2">{preset.description}</p>
                  <div className="theme-preset-palette">
                    <div className="theme-preset-color-pill" style={{ backgroundColor: preset.colors.primaryColor }} title="Primary" />
                    <div className="theme-preset-color-pill" style={{ backgroundColor: preset.colors.sidebarColor }} title="Sidebar" />
                    <div className="theme-preset-color-pill" style={{ backgroundColor: preset.colors.backgroundColor }} title="Background" />
                    <div className="theme-preset-color-pill" style={{ backgroundColor: preset.colors.surfaceColor }} title="Surface" />
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* ── Live Preview Banner & Swatch Bar ── */}
      <div className="theme-preview-banner">
        <div>
          <div className="fw-semibold small d-flex align-items-center gap-2 mb-1" style={{ color: "var(--color-text)" }}>
            <FaEye style={{ color: "var(--color-primary)" }} /> Live Theme Preview Active
          </div>
          <span className="text-muted text-xs">
            Color changes apply instantly to the current session interface before saving.
          </span>
        </div>
        <div className="theme-preview-swatch-bar">
          {COLOR_METADATA.map(({ key, label }) => (
            <div
              key={key}
              className="theme-preview-swatch"
              style={{ backgroundColor: previewTheme[key] || DEFAULT_THEME[key] }}
              title={`${label}: ${previewTheme[key]}`}
            />
          ))}
        </div>
      </div>

      {/* ── Interactive Component Sample Preview ── */}
      <div className="theme-live-preview-box">
        <h6 className="fw-bold text-xs text-uppercase tracking-wider text-muted mb-3 d-flex align-items-center gap-2">
          <FaSlidersH /> Component Live Preview Demo
        </h6>
        <Row className="g-3 align-items-center">
          <Col md={3}>
            <Button
              className="w-100 border-0 fw-semibold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#ffffff",
              }}
            >
              Primary Button
            </Button>
          </Col>
          <Col md={3}>
            <div
              className="p-2 text-center rounded fw-semibold text-xs"
              style={{
                backgroundColor: "var(--color-sidebar)",
                color: "#ffffff",
              }}
            >
              Sidebar Accent Panel
            </div>
          </Col>
          <Col md={6} className="d-flex gap-2 justify-content-end">
            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: "var(--color-success)", color: "#fff" }}>
              Success State
            </span>
            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: "var(--color-warning)", color: "#fff" }}>
              Warning State
            </span>
            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}>
              Danger State
            </span>
            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: "var(--color-info)", color: "#fff" }}>
              Info State
            </span>
          </Col>
        </Row>
      </div>

      {/* ── 13 Configurable Theme Color Cards ── */}
      <Row className="g-3">
        {COLOR_METADATA.map(({ key, label, description }) => {
          const currentColor = previewTheme[key] || DEFAULT_THEME[key];
          const isValidHex = HEX_REGEX.test(currentColor);

          return (
            <Col md={6} lg={4} key={key}>
              <div className="theme-color-card">
                <div>
                  <div className="theme-color-header">
                    <h6 className="theme-color-title">{label}</h6>
                    <span className="badge rounded-pill text-xs border" style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                      {key}
                    </span>
                  </div>
                  <p className="theme-color-desc">{description}</p>
                </div>

                <div className="theme-color-input-group">
                  <Form.Control
                    type="color"
                    className="theme-color-picker"
                    value={isValidHex ? currentColor : "#000000"}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    disabled={!canUpdate || saving}
                    title={`Pick ${label}`}
                  />
                  <Form.Control
                    type="text"
                    className="theme-color-hex-input"
                    value={currentColor}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    disabled={!canUpdate || saving}
                    isInvalid={!isValidHex}
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* ── Sticky Action Bar ── */}
      {canUpdate && (
        <div className="theme-action-bar">
          <div className="d-flex align-items-center gap-2">
            {isModifiedFromSaved && (
              <Badge bg="warning" text="dark" className="px-3 py-2">
                Unsaved Changes
              </Badge>
            )}
            {isModifiedFromDefault && (
              <Badge bg="info" className="px-3 py-2">
                Custom Organization Palette
              </Badge>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              className="d-flex align-items-center gap-2"
              onClick={handleResetToSaved}
              disabled={!isModifiedFromSaved || saving}
            >
              <FaUndo /> Revert Unsaved
            </Button>
            <Button
              variant="outline-dark"
              className="d-flex align-items-center gap-2"
              onClick={handleResetToDefault}
              disabled={saving}
            >
              <FaUndo /> Reset to HRMS Default
            </Button>
            <Button
              variant="warning"
              className="d-flex align-items-center gap-2 fw-semibold px-4"
              style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary-dark)", color: "#ffffff" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" /> Saving Theme...
                </>
              ) : (
                <>
                  <FaSave /> Save Organization Theme
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeCustomizationSection;
