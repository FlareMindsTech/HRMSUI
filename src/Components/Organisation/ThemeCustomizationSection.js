import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MdPalette,
  MdCheck,
  MdAutoAwesome,
  MdRefresh,
} from "react-icons/md";
import {
  PRESET_THEMES,
  applyTwoColorTheme,
  initSavedTheme,
} from "../../utils/themeEngine";
import AvengersSnapTransition from "../Common/AvengersSnapTransition";
import "./ThemeCustomizationSection.css";

export default function ThemeCustomizationSection() {
  const [selectedInk, setSelectedInk] = useState("#0F766E");
  const [selectedBrand, setSelectedBrand] = useState("#FF6F61");

  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [isSnapActive, setIsSnapActive] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);
  const pendingThemeRef = useRef(null);

  // Initialize from storage or DOM
  useEffect(() => {
    const savedColors = initSavedTheme();
    setSelectedInk(savedColors.ink);
    setSelectedBrand(savedColors.brand);

    // Ensure clean planar surface without neumorphic attributes
    document.documentElement.removeAttribute("data-surface");
    try {
      localStorage.removeItem("teamhub_surface_style");
    } catch (e) {}

    // Find if current matches one of PRESET_THEMES
    const matchedIdx = PRESET_THEMES.findIndex(
      (p) =>
        p.ink.toLowerCase() === savedColors.ink.toLowerCase() &&
        p.brand.toLowerCase() === savedColors.brand.toLowerCase()
    );
    if (matchedIdx !== -1) setActivePresetIndex(matchedIdx);
    else setActivePresetIndex(-1);
  }, []);

  const handleSelectPreset = (index) => {
    const preset = PRESET_THEMES[index];
    if (!preset) return;
    setActivePresetIndex(index);
    setSelectedInk(preset.ink);
    setSelectedBrand(preset.brand);
  };

  const handleApplyChanges = useCallback(() => {
    const next = {
      ink: selectedInk,
      brand: selectedBrand,
    };
    pendingThemeRef.current = next;
    setPendingTheme(next);
    setIsSnapActive(true);
  }, [selectedInk, selectedBrand]);

  const handleColorSwitchMidpoint = useCallback(() => {
    const next = pendingThemeRef.current;
    if (next) {
      applyTwoColorTheme(next.ink, next.brand, true);
    }
  }, []);

  const handleSnapComplete = useCallback(() => {
    setIsSnapActive(false);
    setPendingTheme(null);
    pendingThemeRef.current = null;
  }, []);

  const handleResetDefault = () => {
    handleSelectPreset(0);
  };

  return (
    <div className="th-settings-appearance-studio">
      {/* ── Section Header ── */}
      <div className="th-studio-header mb-4 pb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <MdPalette className="text-brand fs-4" /> Appearance &amp; 2-Color Theme Studio
          </h4>
          <p className="text-muted small mb-0">
            Configure system-wide visual identity and apply curated 2-color enterprise palettes.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 fw-semibold d-flex align-items-center gap-1.5"
            onClick={handleResetDefault}
          >
            <MdRefresh size={15} /> Reset Default
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

      {/* ── 1. Curated 11 2-Color Palettes ── */}
      <div className="th-studio-section mb-4">
        <div className="th-studio-section-title">
          <MdPalette className="me-1 text-muted" /> 1. CURATED 2-COLOR ENTERPRISE PALETTES (FROM DESIGN SYSTEM)
        </div>
        <div className="row g-3">
          {PRESET_THEMES.map((preset, index) => {
            const isSelected = activePresetIndex === index;
            return (
              <div key={preset.name} className="col-12 col-sm-6 col-lg-4">
                <div
                  className={`th-palette-preset-card ${isSelected ? "is-active" : ""}`}
                  onClick={() => handleSelectPreset(index)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="th-preset-swatch-bar mb-2">
                    <div
                      className="th-preset-swatch-half"
                      style={{ backgroundColor: preset.ink }}
                      title={`Ink: ${preset.ink}`}
                    />
                    <div
                      className="th-preset-swatch-half"
                      style={{ backgroundColor: preset.brand }}
                      title={`Brand: ${preset.brand}`}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="th-preset-name">{preset.name}</div>
                      <div className="th-preset-hexes">
                        <span className="th-hex-tag" style={{ color: preset.ink }}>
                          {preset.ink}
                        </span>
                        <span className="text-muted">·</span>
                        <span className="th-hex-tag" style={{ color: preset.brand }}>
                          {preset.brand}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="th-palette-check"><MdCheck /></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Custom Hex Tuner ── */}
      <div className="th-studio-section mb-4">
        <div className="th-studio-section-title">
          <MdAutoAwesome className="me-1 text-muted" /> 2. FINE-TUNE EXACT HEX CODES
        </div>
        <div className="card border p-3 bg-white shadow-xs rounded-3">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label extra-small fw-bold text-muted text-uppercase">
                Ink Color (Backgrounds, Headers, Typography, Sidebar)
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
                <span className="small text-muted">Primary structural depth</span>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label extra-small fw-bold text-muted text-uppercase">
                Brand Color (Primary CTAs, Active States, Highlights, Badges)
              </label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color p-0 border"
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
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
                    setActivePresetIndex(-1);
                  }}
                  style={{ maxWidth: "140px" }}
                />
                <span className="small text-muted">Vibrant focal accent</span>
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
