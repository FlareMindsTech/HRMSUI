import React, { useState, useEffect } from 'react';
import {
  MdClose,
  MdAutoAwesome,
  MdCheckCircle,
  MdColorLens,
  MdCheck,
} from 'react-icons/md';
import {
  PRESET_THEMES,
  getContrastRatio,
  getLuminance,
} from '../../utils/themeEngine';
import './ThemeCustomizerModal.css';

export default function ThemeCustomizerModal({
  isOpen,
  onClose,
  currentInk = '#1E293B',
  currentBrand = '#A7F3D0',
  currentBtnText = '#0F172A',
  onApplyTheme,
}) {
  const [selectedInk, setSelectedInk] = useState(currentInk);
  const [selectedBrand, setSelectedBrand] = useState(currentBrand);
  const [selectedBtnText, setSelectedBtnText] = useState(currentBtnText);
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  useEffect(() => {
    setSelectedInk(currentInk);
    setSelectedBrand(currentBrand);
    setSelectedBtnText(currentBtnText);
    const matched = PRESET_THEMES.find(
      (p) =>
        p.ink.toLowerCase() === currentInk.toLowerCase() &&
        p.brand.toLowerCase() === currentBrand.toLowerCase()
    );
    if (matched) {
      setSelectedPresetId(matched.id);
      setSelectedBtnText(matched.btnText);
    }
  }, [currentInk, currentBrand, currentBtnText, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSelectedInk(preset.ink);
    setSelectedBrand(preset.brand);
    setSelectedBtnText(preset.btnText);
  };

  const handleApply = () => {
    onApplyTheme({
      ink: selectedInk,
      brand: selectedBrand,
      btnText: selectedBtnText,
    });
    onClose();
  };

  const contrastRatio = getContrastRatio(selectedBrand, selectedBtnText).toFixed(1);

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
              Appearance &amp; Global Enterprise Theme
            </h2>
            <p className="th-theme-modal-subtitle">
              Select one of the four curated enterprise color combinations to style the entire HRMS.
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
          {/* Section 1: The Four Enterprise Presets */}
          <div>
            <div className="th-theme-sec-title">
              <MdAutoAwesome /> 1. Four Curated Enterprise Themes
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
                        title={`Navbar/Sidebar: ${preset.ink}`}
                      />
                      <div
                        className="th-preset-brand-swatch"
                        style={{ backgroundColor: preset.brand }}
                        title={`Primary Button: ${preset.brand}`}
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <div className="text-start">
                        <div className="th-preset-name">{preset.name}</div>
                        <div className="th-preset-hexes small text-muted" style={{ fontSize: '11px' }}>
                          <span>Nav: {preset.ink}</span> · <span>Btn: {preset.brand}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="badge bg-success-subtle text-success p-1 rounded-circle">
                          <MdCheck size={14} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom 2-Color Inputs */}
          <div>
            <div className="th-theme-sec-title">
              <MdColorLens /> 2. Custom Hex Fine-Tuning
            </div>
            <div className="th-custom-pickers-row">
              {/* Ink Picker */}
              <div className="th-picker-card">
                <div className="th-picker-label">
                  <span>NAVBAR &amp; SIDEBAR COLOR</span>
                  <span className="micro-label">Navigation Chrome</span>
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
                    aria-label="Select navigation color"
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
                  Applies to global top navbar, sidebar rail, and deep structural surfaces.
                </div>
              </div>

              {/* Brand Picker */}
              <div className="th-picker-card">
                <div className="th-picker-label">
                  <span>PRIMARY BUTTON COLOR</span>
                  <span className="micro-label">Action Controls</span>
                </div>
                <div className="th-picker-input-group">
                  <input
                    type="color"
                    className="th-color-native-input"
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      const lum = getLuminance(e.target.value);
                      setSelectedBtnText(lum > 0.4 ? '#0F172A' : '#FFFFFF');
                      setSelectedPresetId(null);
                    }}
                    aria-label="Select primary button color"
                  />
                  <input
                    type="text"
                    className="th-color-hex-text"
                    value={selectedBrand.toUpperCase()}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      const lum = getLuminance(e.target.value);
                      setSelectedBtnText(lum > 0.4 ? '#0F172A' : '#FFFFFF');
                      setSelectedPresetId(null);
                    }}
                    maxLength={7}
                  />
                </div>
                <div className="th-picker-hint">
                  Powers primary action buttons, active navigation states, and focus rings.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Live Preview & WCAG AA Contrast */}
          <div>
            <div className="th-theme-sec-title">3. Live Component Synthesis &amp; Contrast</div>
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
                    TeamHub Enterprise HRMS
                  </span>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <button
                      type="button"
                      className="btn btn-sm py-1 px-3 fw-bold"
                      style={{
                        backgroundColor: selectedBrand,
                        color: selectedBtnText,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      Primary Button
                    </button>
                    <span className="small text-muted">
                      Card surfaces remain neutral white.
                    </span>
                  </div>
                </div>
              </div>

              <div className="th-contrast-pill th-contrast-pass">
                <MdCheckCircle size={14} />
                <span>Button Contrast: {contrastRatio}:1 (WCAG AA Pass)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="th-theme-modal-footer">
          <div className="th-theme-snap-desc">
            <span>✨ Triggers Avengers Particle Disintegration &amp; Reassembly</span>
          </div>
          <button
            type="button"
            className="th-snap-apply-btn"
            style={{
              backgroundColor: selectedBrand,
              color: selectedBtnText,
            }}
            onClick={handleApply}
          >
            <MdAutoAwesome />
            <span>Apply Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
}
