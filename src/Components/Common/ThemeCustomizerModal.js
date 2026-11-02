import React, { useState, useEffect } from 'react';
import {
  MdClose,
  MdAutoAwesome,
  MdCheckCircle,
  MdColorLens,
  MdLayers,
} from 'react-icons/md';
import {
  PRESET_THEMES,
  getContrastRatio,
  initSurfaceStyle,
} from '../../utils/themeEngine';
import './ThemeCustomizerModal.css';

export default function ThemeCustomizerModal({
  isOpen,
  onClose,
  currentInk = '#0F1F18',
  currentBrand = '#C7882C',
  onApplyTheme,
}) {
  const [selectedInk, setSelectedInk] = useState(currentInk);
  const [selectedBrand, setSelectedBrand] = useState(currentBrand);
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  useEffect(() => {
    setSelectedInk(currentInk);
    setSelectedBrand(currentBrand);
  }, [currentInk, currentBrand, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSelectedInk(preset.ink);
    setSelectedBrand(preset.brand);
  };

  const handleApply = () => {
    onApplyTheme({
      ink: selectedInk,
      brand: selectedBrand,
    });
    onClose();
  };

  const contrastInkOnWhite = getContrastRatio(selectedInk, '#FFFFFF').toFixed(1);

  return (
    <div
      className="th-theme-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="th-theme-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-customizer-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="th-theme-modal-header">
          <div className="th-theme-modal-title-wrap">
            <h2 id="theme-customizer-title" className="th-theme-modal-title">
              Appearance & 2-Color Theme Engine
            </h2>
            <p className="th-theme-modal-subtitle">
              Configure your two-color enterprise palette.
            </p>
          </div>
          <button
            type="button"
            className="th-theme-modal-close"
            onClick={onClose}
            aria-label="Close appearance modal"
          >
            <MdClose />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="th-theme-modal-body">
          {/* Section 1: Curated Luxury Presets */}
          <div>
            <div className="th-theme-sec-title">
              <MdAutoAwesome /> 1. Curated Enterprise Palettes
            </div>
            <div className="th-preset-grid">
              {PRESET_THEMES.map((preset) => {
                const isSelected =
                  selectedInk.toLowerCase() === preset.ink.toLowerCase() &&
                  selectedBrand.toLowerCase() === preset.brand.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`th-preset-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <div className="th-preset-palette-preview">
                      <div
                        className="th-preset-ink-swatch"
                        style={{ backgroundColor: preset.ink }}
                      />
                      <div
                        className="th-preset-brand-swatch"
                        style={{ backgroundColor: preset.brand }}
                      />
                    </div>
                    <div className="th-preset-name">{preset.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Custom 2-Color Inputs */}
          <div>
            <div className="th-theme-sec-title">
              <MdColorLens /> 3. Custom 2-Color Selection
            </div>
            <div className="th-custom-pickers-row">
              {/* Ink Picker */}
              <div className="th-picker-card">
                <div className="th-picker-label">
                  <span>INK COLOR</span>
                  <span className="micro-label">Sidebar & Headings</span>
                </div>
                <div className="th-picker-input-group">
                  <input
                    type="color"
                    className="th-color-native-input"
                    value={selectedInk}
                    onChange={(e) => {
                      setSelectedInk(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    aria-label="Select ink color"
                  />
                  <input
                    type="text"
                    className="th-color-hex-text"
                    value={selectedInk.toUpperCase()}
                    onChange={(e) => {
                      setSelectedInk(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    maxLength={7}
                  />
                </div>
                <div className="th-picker-hint">
                  Defines sidebar, primary headings, hairline borders & deep canvas.
                </div>
              </div>

              {/* Brand Picker */}
              <div className="th-picker-card">
                <div className="th-picker-label">
                  <span>BRAND COLOR</span>
                  <span className="micro-label">Actions & Accents</span>
                </div>
                <div className="th-picker-input-group">
                  <input
                    type="color"
                    className="th-color-native-input"
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    aria-label="Select brand color"
                  />
                  <input
                    type="text"
                    className="th-color-hex-text"
                    value={selectedBrand.toUpperCase()}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    maxLength={7}
                  />
                </div>
                <div className="th-picker-hint">
                  Powers primary action buttons, active navigation, badges & charts.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Live Token Synthesis & Contrast Verification */}
          <div>
            <div className="th-theme-sec-title">Live Token Synthesis & Contrast Verification</div>
            <div className="th-live-preview-box">
              <div className="th-live-preview-sample">
                <div
                  className="th-preview-sidebar-mini"
                  style={{ backgroundColor: selectedInk }}
                >
                  <span style={{ color: selectedBrand }}>T</span>
                </div>
                <div className="th-preview-text-group">
                  <span
                    className="th-preview-primary-title"
                    style={{ color: selectedInk }}
                  >
                    TeamHub Enterprise
                  </span>
                  <span
                    className="th-preview-subtext"
                    style={{ color: selectedBrand }}
                  >
                    ● Two-Color Palette Active
                  </span>
                </div>
              </div>

              <div className="th-contrast-pill th-contrast-pass">
                <MdCheckCircle size={14} />
                <span>WCAG Contrast: {contrastInkOnWhite}:1 Pass</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="th-theme-modal-footer">
          <div className="th-theme-snap-desc">
            <span>✨ Triggers Avengers Particle Disintegration & Reassembly</span>
          </div>
          <button
            type="button"
            className="th-snap-apply-btn"
            style={{
              backgroundColor: selectedBrand,
              color: selectedInk,
            }}
            onClick={handleApply}
          >
            <MdAutoAwesome />
            <span>Done · Snap & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

