/**
 * TeamHub Dynamic 2-Color Theme Engine & Color Utilities
 * Calculates full enterprise color tokens derived from exactly TWO customizable colors (INK & BRAND).
 * Enforces HRMS Light Mode Only Policy: all surfaces, cards, text and borders remain in crisp light mode.
 */

export function hexToRgb(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Mixes two colors: color1 * (1 - ratio) + color2 * ratio
 * ratio = 0 returns color1; ratio = 1 returns color2.
 */
export function mixColors(hex1, hex2, ratio) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const r = c1.r * (1 - ratio) + c2.r * ratio;
  const g = c1.g * (1 - ratio) + c2.g * ratio;
  const b = c1.b * (1 - ratio) + c2.b * ratio;
  return rgbToHex(r, g, b);
}

export function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * EXACT FOUR ENTERPRISE PRESET THEMES (HRMS Theme Customization Standard)
 */
export const PRESET_THEMES = [
  {
    id: 'deep-navy-mint',
    name: 'Theme 1 – Deep Navy Blue & Mint Green',
    ink: '#1E293B',
    brand: '#A7F3D0',
    btnText: '#0F172A',
    description: 'Executive deep navy blue navigation with fresh mint green actions',
  },
  {
    id: 'charcoal-peach',
    name: 'Theme 2 – Charcoal Grey & Warm Peach',
    ink: '#334155',
    brand: '#FED7AA',
    btnText: '#1E293B',
    description: 'Refined charcoal grey navigation with warm peach actions',
  },
  {
    id: 'slate-yellow',
    name: 'Theme 3 – Dark Slate Blue & Pastel Yellow',
    ink: '#1E293B',
    brand: '#FEF08A',
    btnText: '#1E293B',
    description: 'Dark slate blue navigation with luminous pastel yellow actions',
  },
  {
    id: 'forest-lavender',
    name: 'Theme 4 – Deep Forest Green & Pastel Lavender',
    ink: '#064E3B',
    brand: '#E9D5FF',
    btnText: '#1E293B',
    description: 'Deep forest green navigation with gentle pastel lavender actions',
  },
];

/**
 * Enforces the Light Mode Only Policy across the HRMS application.
 * Strips any stale dark-mode attributes from document and body,
 * and purges any legacy dark-mode storage keys.
 */
export function ensureLightModeOnly() {
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-bs-theme');
    document.documentElement.classList.remove('theme-dark');
    if (document.body) {
      document.body.removeAttribute('data-theme');
      document.body.removeAttribute('data-bs-theme');
      document.body.classList.remove('theme-dark');
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('teamhub_theme_mode');
      localStorage.removeItem('themeMode');
      localStorage.removeItem('darkMode');
    } catch {
      // ignore
    }
  }
}

// Automatically enforce light mode on script load
if (typeof window !== 'undefined') {
  ensureLightModeOnly();
}

/**
 * Applies a 2-color pair dynamically across the entire document
 */
export function applyTwoColorTheme(inkHex, brandHex, saveToStorage = true, btnTextColor = null) {
  ensureLightModeOnly();
  const root = document.documentElement;

  // Primary base colors
  root.style.setProperty('--color-ink', inkHex);
  root.style.setProperty('--color-brand', brandHex);

  // Dedicated Navigation & Sidebar Tokens
  root.style.setProperty('--theme-nav-bg', inkHex);
  root.style.setProperty('--theme-nav-text', '#FFFFFF');
  root.style.setProperty('--theme-sidebar-bg', inkHex);
  root.style.setProperty('--theme-sidebar-text', '#FFFFFF');
  root.style.setProperty('--sidebar-bg', inkHex);

  // Theme-independent semantic neutrals remain invariant across brand theme changes (Light Mode Only)
  // (Main text #0F172A, borders #E2E8F0, card surfaces #FFFFFF stay stable in light mode)

  // Sidebar (derived from INK)
  root.style.setProperty('--sidebar-surface', mixColors(inkHex, '#FFFFFF', 0.12));
  root.style.setProperty('--sidebar-surface-hover', mixColors(inkHex, '#FFFFFF', 0.20));
  root.style.setProperty('--sidebar-surface-active', mixColors(inkHex, '#FFFFFF', 0.26));
  root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.12)');
  root.style.setProperty('--sidebar-border-subtle', 'rgba(255, 255, 255, 0.08)');
  root.style.setProperty('--sidebar-text', 'rgba(255, 255, 255, 0.90)');
  root.style.setProperty('--sidebar-text-muted', 'rgba(255, 255, 255, 0.65)');
  root.style.setProperty('--sidebar-text-active', '#FFFFFF');

  // Contrast text for brand buttons: prioritize preset explicit text color, or auto-calculate
  let contrastText = btnTextColor;
  if (!contrastText) {
    const lum = getLuminance(brandHex);
    contrastText = lum > 0.4 ? (lum > 0.6 ? '#0F172A' : '#1E293B') : '#FFFFFF';
  }
  root.style.setProperty('--brand-contrast-text', contrastText);

  // Primary Button Tokens
  root.style.setProperty('--btn-primary-bg', brandHex);
  root.style.setProperty('--btn-primary-border', brandHex);
  root.style.setProperty('--btn-primary-text', contrastText);

  const brandHover = mixColors(brandHex, '#000000', 0.10);
  const brandActive = mixColors(brandHex, '#000000', 0.18);

  root.style.setProperty('--btn-primary-hover-bg', brandHover);
  root.style.setProperty('--btn-primary-hover-border', brandHover);
  root.style.setProperty('--btn-primary-hover-text', contrastText);
  root.style.setProperty('--btn-primary-active-bg', brandActive);
  root.style.setProperty('--btn-primary-active-border', brandActive);

  // Outline Button Tokens
  root.style.setProperty('--btn-outline-text', brandHex);
  root.style.setProperty('--btn-outline-border', brandHex);
  root.style.setProperty('--btn-outline-hover-border', brandHover);
  root.style.setProperty('--btn-outline-hover-text', brandHover);

  // Derived from BRAND
  root.style.setProperty('--brand-fill', brandHex);
  root.style.setProperty('--brand-hover', brandHover);
  root.style.setProperty('--brand-active', brandActive);
  root.style.setProperty('--brand-tint', mixColors(brandHex, '#FFFFFF', 0.88));
  root.style.setProperty('--brand-tint-strong', mixColors(brandHex, '#FFFFFF', 0.78));
  root.style.setProperty('--brand-border', mixColors(brandHex, '#FFFFFF', 0.68));

  // Focus Ring
  root.style.setProperty('--focus-ring', `0 0 0 2px #FFFFFF, 0 0 0 4px ${brandHex}`);

  // Tab Active Highlights
  root.style.setProperty('--tab-control-active-text', brandHex);
  root.style.setProperty('--tab-control-active-border', brandHex);

  // Legacy page CSS compatibility
  root.style.setProperty('--c-gold', brandHex);
  root.style.setProperty('--c-gold-dark', brandHover);
  root.style.setProperty('--c-gold-tint', mixColors(brandHex, '#FFFFFF', 0.85));
  root.style.setProperty('--c-charcoal', inkHex);
  root.style.setProperty('--color-primary', brandHex);
  root.style.setProperty('--color-primary-dark', brandHover);
  root.style.setProperty('--color-primary-light', mixColors(brandHex, '#FFFFFF', 0.85));
  root.style.setProperty('--primary', brandHex);
  root.style.setProperty('--primary-dark', brandHover);
  root.style.setProperty('--primary-light', mixColors(brandHex, '#FFFFFF', 0.85));
  root.style.setProperty('--pm-primary', brandHex);
  root.style.setProperty('--color-sidebar', inkHex);

  if (saveToStorage) {
    try {
      localStorage.setItem('teamhub_custom_ink', inkHex);
      localStorage.setItem('teamhub_custom_brand', brandHex);
      localStorage.setItem('teamhub_custom_btn_text', contrastText);
    } catch {
      // ignore
    }
  }
}

/**
 * Manages Surface Style: 'classic' (flat & hairline)
 */
export function setSurfaceStyle(style = 'classic') {
  document.documentElement.removeAttribute('data-surface');
  try {
    localStorage.removeItem('teamhub_surface_style');
  } catch {
    // ignore
  }
}

export function initSurfaceStyle() {
  document.documentElement.removeAttribute('data-surface');
  try {
    localStorage.removeItem('teamhub_surface_style');
  } catch {
    // ignore
  }
  return 'classic';
}

/**
 * Initializes saved theme from localStorage on app boot (Defaults to Theme 1, enforces light mode)
 */
export function initSavedTheme() {
  ensureLightModeOnly();
  try {
    const savedInk = localStorage.getItem('teamhub_custom_ink');
    const savedBrand = localStorage.getItem('teamhub_custom_brand');
    const savedBtnText = localStorage.getItem('teamhub_custom_btn_text');
    initSurfaceStyle();
    if (savedInk && savedBrand) {
      applyTwoColorTheme(savedInk, savedBrand, false, savedBtnText);
      return { ink: savedInk, brand: savedBrand, btnText: savedBtnText };
    }
  } catch {
    // ignore
  }
  const defaultTheme = PRESET_THEMES[0];
  applyTwoColorTheme(defaultTheme.ink, defaultTheme.brand, false, defaultTheme.btnText);
  return { ink: defaultTheme.ink, brand: defaultTheme.brand, btnText: defaultTheme.btnText };
}
