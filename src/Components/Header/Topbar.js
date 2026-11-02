import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  MdSearch,
  MdNotificationsNone,
  MdHelpOutline,
  MdPalette,
  MdMenu,
  MdLayers,
} from 'react-icons/md';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../redux/slices/authSlice';
import ThemeCustomizerModal from '../Common/ThemeCustomizerModal';
import AvengersSnapTransition from '../Common/AvengersSnapTransition';
import {
  initSavedTheme,
  applyTwoColorTheme,
  initSurfaceStyle,
  setSurfaceStyle,
} from '../../utils/themeEngine';
import './Topbar.css';

export default function Topbar({ onToggleMobileMenu, hideTopbar = false }) {
  const location = useLocation();
  const user = useSelector(selectAuthUser);

  // Current active colors
  const [currentColors, setCurrentColors] = useState(() => {
    return initSavedTheme();
  });

  // Current surface style ('classic' vs 'neumorphic')
  const [surfaceStyle, setSurfaceStyleState] = useState(() => {
    return initSurfaceStyle();
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [pendingThemeChange, setPendingThemeChange] = useState(null);
  const pendingThemeRef = useRef(null);
  const [isSnapActive, setIsSnapActive] = useState(false);

  useEffect(() => {
    const saved = initSavedTheme();
    setCurrentColors(saved);
    const savedSurface = initSurfaceStyle();
    setSurfaceStyleState(savedSurface);
  }, []);

  const handleApplyTheme = useCallback(({ ink, brand, surface }) => {
    pendingThemeRef.current = { ink, brand, surface };
    setPendingThemeChange({ ink, brand, surface });
    setIsSnapActive(true);
  }, []);

  // Quick toggle directly on topbar for Neumorphism vs Classic
  const handleQuickToggleSurface = useCallback(() => {
    const nextSurface = surfaceStyle === 'neumorphic' ? 'classic' : 'neumorphic';
    const next = {
      ink: currentColors.ink,
      brand: currentColors.brand,
      surface: nextSurface,
    };
    pendingThemeRef.current = next;
    setPendingThemeChange(next);
    setIsSnapActive(true);
  }, [surfaceStyle, currentColors]);

  // Listen for sidebar triggers when topbar is hidden
  useEffect(() => {
    const handleOpenModal = () => setIsThemeModalOpen(true);
    const handleToggleSurfaceEvent = () => handleQuickToggleSurface();
    window.addEventListener('teamhub:open-theme-modal', handleOpenModal);
    window.addEventListener('teamhub:toggle-surface', handleToggleSurfaceEvent);
    return () => {
      window.removeEventListener('teamhub:open-theme-modal', handleOpenModal);
      window.removeEventListener('teamhub:toggle-surface', handleToggleSurfaceEvent);
    };
  }, [handleQuickToggleSurface]);

  const handleColorSwitchMidpoint = useCallback(() => {
    const next = pendingThemeRef.current;
    if (next) {
      const { ink, brand, surface } = next;
      applyTwoColorTheme(ink, brand, true);
      setCurrentColors({ ink, brand });
      if (surface) {
        setSurfaceStyle(surface);
        setSurfaceStyleState(surface);
      }
    }
  }, []);

  const handleSnapComplete = useCallback(() => {
    setIsSnapActive(false);
    setPendingThemeChange(null);
    pendingThemeRef.current = null;
  }, []);

  // Derive breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbSection = pathSegments[0]
    ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1)
    : 'Dashboard';
  const breadcrumbChild = pathSegments[1]
    ? pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1)
    : null;

  const displayName = user?.name || user?.fullName || 'Bharath';

  return (
    <>
      {!hideTopbar && (
        <header className="th-topbar" role="banner">
        {/* ── Left: Breadcrumb ── */}
        <div className="th-topbar-breadcrumb">
          {onToggleMobileMenu && (
            <button
              type="button"
              className="th-icon-btn d-md-none"
              onClick={onToggleMobileMenu}
              aria-label="Open navigation menu"
            >
              <MdMenu size={20} />
            </button>
          )}
          <Link to="/dashboard" className="th-breadcrumb-root">
            Workspace
          </Link>
          <span className="th-breadcrumb-sep">/</span>
          <span className="th-breadcrumb-current">{breadcrumbSection}</span>
          {breadcrumbChild && (
            <>
              <span className="th-breadcrumb-sep">/</span>
              <span className="th-breadcrumb-current">{breadcrumbChild}</span>
            </>
          )}
        </div>

        {/* ── Center: Search Bar ── */}
        <div className="th-topbar-search-container">
          <MdSearch className="th-search-icon" />
          <input
            type="text"
            className="th-search-input"
            placeholder="Search people, pages, requests..."
            aria-label="Global search"
          />
          <span className="th-search-shortcut" title="Command palette shortcut">
            Ctrl K
          </span>
        </div>

        {/* ── Right: Utilities & Actions ── */}
        <div className="th-topbar-actions">
          {/* Real-time Sync Status */}
          <div className="th-sync-status" title="Real-time backend synchronization active">
            <span className="th-sync-pulse" aria-hidden="true" />
            <span>Synced 09:52</span>
          </div>

          {/* Quick Neumorphism vs Classic Toggle */}
          <button
            type="button"
            className={`th-surface-toggle-btn ${surfaceStyle === 'neumorphic' ? 'is-neu-active' : ''}`}
            onClick={handleQuickToggleSurface}
            title={`Toggle Surface Style (Current: ${surfaceStyle === 'neumorphic' ? 'Neumorphism 3D' : 'Classic Editorial'})`}
            aria-label="Toggle neumorphism theme"
          >
            <MdLayers size={15} />
            <span>{surfaceStyle === 'neumorphic' ? 'Neumorphic 3D' : 'Classic'}</span>
          </button>

          {/* 2-Color Dynamic Theme Switcher with Avengers Snap Animation */}
          <button
            type="button"
            className="th-theme-toggle"
            onClick={() => setIsThemeModalOpen(true)}
            title="Open 2-Color Theme & Neumorphism Customizer"
            aria-label="Customize theme colors and appearance"
          >
            <span
              className="th-theme-swatch"
              style={{ backgroundColor: currentColors.brand }}
              aria-hidden="true"
            />
            <span>2-Color Palette</span>
          </button>

          {/* Contextual Help */}
          <button
            type="button"
            className="th-icon-btn"
            title="Documentation & Keyboard Shortcuts (?)"
            aria-label="Help and documentation"
          >
            <MdHelpOutline />
          </button>

          {/* Notifications with Indicator */}
          <button
            type="button"
            className="th-icon-btn"
            title="3 Unread Notifications"
            aria-label="Notifications"
          >
            <MdNotificationsNone />
            <span className="th-notif-badge" aria-label="3 unread" />
          </button>

          {/* User Avatar */}
          <div
            className="th-user-topbar-avatar"
            title={`${displayName} - User Profile`}
            aria-label={`${displayName} profile`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>
      )}

      {/* ── 2-Color Theme & Neumorphism Customizer Modal ── */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentInk={currentColors.ink}
        currentBrand={currentColors.brand}
        currentSurface={surfaceStyle}
        onApplyTheme={handleApplyTheme}
      />

      {/* ── Avengers Disintegration & Reassembly Snap Animation ── */}
      <AvengersSnapTransition
        active={isSnapActive}
        oldColors={currentColors}
        newColors={pendingThemeChange || currentColors}
        onColorSwitch={handleColorSwitchMidpoint}
        onComplete={handleSnapComplete}
      />
    </>
  );
}

