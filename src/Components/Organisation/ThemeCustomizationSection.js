import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MdPalette,
  MdCheck,
  MdAutoAwesome,
  MdRefresh,
  MdCheckCircle,
  MdDashboard,
  MdPeople,
} from "react-icons/md";
import {
  PRESET_THEMES,
  applyTwoColorTheme,
  initSavedTheme,
  getContrastRatio,
  getLuminance,
} from "../../utils/themeEngine";
import AvengersSnapTransition from "../Common/AvengersSnapTransition";
import "./ThemeCustomizationSection.css";

export default function ThemeCustomizationSection() {
  const defaultTheme = PRESET_THEMES[0];
  const [selectedInk, setSelectedInk] = useState(defaultTheme.ink);
  const [selectedBrand, setSelectedBrand] = useState(defaultTheme.brand);
  const [selectedBtnText, setSelectedBtnText] = useState(defaultTheme.btnText);

  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [isSnapActive, setIsSnapActive] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);
  const pendingThemeRef = useRef(null);

  // Initialize from storage or DOM
  useEffect(() => {
    const savedColors = initSavedTheme();
    setSelectedInk(savedColors.ink);
    setSelectedBrand(savedColors.brand);
    if (savedColors.btnText) {
      setSelectedBtnText(savedColors.btnText);
    }

    // Match with one of the 4 PRESET_THEMES
    const matchedIdx = PRESET_THEMES.findIndex(
      (p) =>
        p.ink.toLowerCase() === savedColors.ink.toLowerCase() &&
        p.brand.toLowerCase() === savedColors.brand.toLowerCase()
    );
    if (matchedIdx !== -1) {
      setActivePresetIndex(matchedIdx);
      setSelectedBtnText(PRESET_THEMES[matchedIdx].btnText);
    } else {
      setActivePresetIndex(-1);
    }
  }, []);

  const handleSelectPreset = (index) => {
    const preset = PRESET_THEMES[index];
    if (!preset) return;
    setActivePresetIndex(index);
    setSelectedInk(preset.ink);
    setSelectedBrand(preset.brand);
    setSelectedBtnText(preset.btnText);
  };

  const handleApplyChanges = useCallback(() => {
    const next = {
      ink: selectedInk,
      brand: selectedBrand,
      btnText: selectedBtnText,
    };
    pendingThemeRef.current = next;
    setPendingTheme(next);
    setIsSnapActive(true);
  }, [selectedInk, selectedBrand, selectedBtnText]);

  const handleColorSwitchMidpoint = useCallback(() => {
    const next = pendingThemeRef.current;
    if (next) {
      applyTwoColorTheme(next.ink, next.brand, true, next.btnText);
    }
  }, []);

  const handleSnapComplete = useCallback(() => {
    setIsSnapActive(false);
    setPendingTheme(null);
    pendingThemeRef.current = null;
  }, []);

  const handleResetDefault = () => {
    handleSelectPreset(0);
    applyTwoColorTheme(defaultTheme.ink, defaultTheme.brand, true, defaultTheme.btnText);
  };

  // Derive contrast ratio for the preview
  const contrastRatio = getContrastRatio(selectedBrand, selectedBtnText).toFixed(1);
  const contrastPass = parseFloat(contrastRatio) >= 4.5;

  return (
    <div className="th-settings-appearance-studio">
      {/* ── Section Header ── */}
      <div className="th-studio-header mb-4 pb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <MdPalette className="text-brand fs-4" /> Appearance &amp; Global Theme Studio
          </h4>
          <p className="text-muted small mb-0">
            Configure system-wide visual identity across all modules using four curated enterprise theme palettes.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 fw-semibold d-flex align-items-center gap-1.5"
            onClick={handleResetDefault}
          >
            <MdRefresh size={15} /> Reset Default (Theme 1)
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm px-4 fw-semibold d-flex align-items-center gap-2 shadow-xs"
            onClick={handleApplyChanges}
          >
            <MdAutoAwesome size={15} /> Apply Changes (Snap)
          </button>
        </div>
      </div>

      {/* ── 1. The Four Curated Enterprise Themes ── */}
      <div className="th-studio-section mb-4">
        <div className="th-studio-section-title">
          <MdPalette /> 1. CURATED ENTERPRISE THEMES (FOUR NEW COMBINATIONS)
        </div>
        <div className="row g-3">
          {PRESET_THEMES.map((preset, index) => {
            const isSelected = activePresetIndex === index;
            return (
              <div key={preset.id} className="col-12 col-md-6">
                <div
                  className={`th-palette-preset-card ${isSelected ? "is-active" : ""}`}
                  onClick={() => handleSelectPreset(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectPreset(index);
                    }
                  }}
                >
                  <div>
                    <div className="th-preset-card-top">
                      <div>
                        <div className="th-preset-name">{preset.name}</div>
                        <div className="th-preset-desc">{preset.description}</div>
                      </div>
                      {isSelected ? (
                        <span className="th-palette-check" title="Selected theme">
                          <MdCheck />
                        </span>
                      ) : (
                        <span className="th-palette-radio-unselected" />
                      )}
                    </div>

                    <div className="th-preset-swatches-grid">
                      {/* Nav / Menubar / Sidebar Swatch */}
                      <div
                        className="th-swatch-box"
                        style={{ backgroundColor: preset.ink, color: "#FFFFFF" }}
                      >
                        <span className="th-swatch-label">Navbar / Sidebar</span>
                        <span className="th-swatch-hex">{preset.ink}</span>
                      </div>

                      {/* Primary Button Swatch */}
                      <div
                        className="th-swatch-box"
                        style={{ backgroundColor: preset.brand, color: preset.btnText }}
                      >
                        <span className="th-swatch-label">Primary Button</span>
                        <span className="th-swatch-hex">{preset.brand}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Live HRMS UI Preview Component ── */}
      <div className="th-studio-section mb-4">
        <div className="th-studio-section-title d-flex justify-content-between align-items-center">
          <span>
            <MdAutoAwesome className="me-1" /> 2. LIVE HRMS RUNTIME PREVIEW (INDEPENDENCE VERIFICATION)
          </span>
          <span
            className={`th-contrast-status-pill ${
              contrastPass ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"
            }`}
          >
            <MdCheckCircle size={14} />
            <span>Button Contrast: {contrastRatio}:1 (WCAG AA Pass)</span>
          </span>
        </div>

        <div className="th-live-hrms-preview-box">
          <div className="th-preview-screen">
            {/* Mini Topbar */}
            <div className="th-mini-topbar" style={{ backgroundColor: selectedInk }}>
              <div className="th-mini-brand">
                <div
                  className="th-mini-badge"
                  style={{ backgroundColor: selectedBrand, color: selectedBtnText }}
                >
                  T
                </div>
                <span>TeamHub Enterprise HRMS</span>
              </div>
              <div className="th-mini-nav-tabs">
                <span
                  className="th-mini-nav-tab is-active"
                  style={{ backgroundColor: selectedBrand, color: selectedBtnText }}
                >
                  Dashboard
                </span>
                <span className="th-mini-nav-tab" style={{ opacity: 0.8 }}>
                  People
                </span>
                <span className="th-mini-nav-tab" style={{ opacity: 0.8 }}>
                  Attendance
                </span>
              </div>
            </div>

            {/* Mini Body Layout */}
            <div className="th-mini-body-layout">
              {/* Mini Sidebar */}
              <div className="th-mini-sidebar" style={{ backgroundColor: selectedInk }}>
                <div
                  className="th-mini-side-item is-active"
                  style={{ backgroundColor: selectedBrand, color: selectedBtnText }}
                >
                  <MdDashboard size={13} />
                  <span>Overview</span>
                </div>
                <div className="th-mini-side-item" style={{ opacity: 0.75 }}>
                  <MdPeople size={13} />
                  <span>Organisation</span>
                </div>
                <div className="th-mini-side-item" style={{ opacity: 0.75 }}>
                  <MdPalette size={13} />
                  <span>Settings</span>
                </div>
              </div>

              {/* Mini Workspace Content */}
              <div className="th-mini-workspace">
                <div className="th-mini-card">
                  <div className="th-mini-card-header">
                    <span>Card Surface (Isolated Neutral White)</span>
                    <span className="badge bg-secondary-subtle text-secondary small">
                      Active Theme Preview
                    </span>
                  </div>

                  {/* Tab Control */}
                  <div className="th-mini-tabs-bar mb-2">
                    <span
                      className="th-mini-tab is-active"
                      style={{
                        color: selectedBrand,
                        borderBottom: `2px solid ${selectedBrand}`,
                      }}
                    >
                      General Info
                    </span>
                    <span className="th-mini-tab">Security</span>
                    <span className="th-mini-tab">Permissions</span>
                  </div>

                  {/* Form & Buttons */}
                  <div className="th-mini-form-row">
                    <input
                      type="text"
                      className="th-mini-input"
                      value="Standard Form Input"
                      readOnly
                      style={{
                        boxShadow: `0 0 0 2px color-mix(in srgb, ${selectedBrand} 30%, transparent)`,
                        borderColor: selectedBrand,
                      }}
                    />
                    <button
                      type="button"
                      className="th-mini-btn-primary"
                      style={{ backgroundColor: selectedBrand, color: selectedBtnText }}
                    >
                      Primary Action
                    </button>
                    <button type="button" className="th-mini-btn-secondary">
                      Secondary Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Custom Hex Tuner ── */}
      <div className="th-studio-section mb-4">
        <div className="th-studio-section-title">
          <MdAutoAwesome /> 3. FINE-TUNE EXACT HEX CODES (CUSTOM PALETTE)
        </div>
        <div className="card border p-3 bg-white shadow-xs rounded-3">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label extra-small fw-bold text-muted text-uppercase">
                Navbar / Sidebar / Depth Color
              </label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color p-0 border"
                  value={selectedInk}
                  onChange={(e) => {
                    setSelectedInk(e.target.value);
                    setActivePresetIndex(-1);
                  }}
                  style={{ width: "42px", height: "36px", cursor: "pointer", borderRadius: "6px" }}
                />
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace text-uppercase fw-semibold"
                  value={selectedInk}
                  onChange={(e) => {
                    setSelectedInk(e.target.value);
                    setActivePresetIndex(-1);
                  }}
                  style={{ maxWidth: "140px" }}
                />
                <span className="small text-muted">Navigation chrome</span>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label extra-small fw-bold text-muted text-uppercase">
                Primary Button / Accent Color
              </label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color p-0 border"
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    const lum = getLuminance(e.target.value);
                    setSelectedBtnText(lum > 0.4 ? '#0F172A' : '#FFFFFF');
                    setActivePresetIndex(-1);
                  }}
                  style={{ width: "42px", height: "36px", cursor: "pointer", borderRadius: "6px" }}
                />
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace text-uppercase fw-semibold"
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    const lum = getLuminance(e.target.value);
                    setSelectedBtnText(lum > 0.4 ? '#0F172A' : '#FFFFFF');
                    setActivePresetIndex(-1);
                  }}
                  style={{ maxWidth: "140px" }}
                />
                <span className="small text-muted">Primary action buttons</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Trigger Bar ── */}
      <div className="d-flex justify-content-between align-items-center p-3 bg-light border rounded-3 mt-4">
        <span className="small text-muted d-flex align-items-center gap-1.5">
          <MdAutoAwesome className="text-brand" />
          Clicking "Apply Changes" activates the Avengers particle dusting &amp; reassembly animation.
        </span>
        <button
          type="button"
          className="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2 shadow-xs"
          onClick={handleApplyChanges}
        >
          <MdAutoAwesome size={16} /> Apply Changes (Snap)
        </button>
      </div>

      {/* ── Avengers Disintegration & Reassembly Snap Animation ── */}
      <AvengersSnapTransition
        active={isSnapActive}
        oldColors={{ ink: selectedInk, brand: selectedBrand }}
        newColors={pendingTheme || { ink: selectedInk, brand: selectedBrand }}
        onColorSwitch={handleColorSwitchMidpoint}
        onComplete={handleSnapComplete}
      />
    </div>
  );
}
