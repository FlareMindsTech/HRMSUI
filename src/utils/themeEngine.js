/**
 * TeamHub Dynamic 2-Color Theme Engine & Color Utilities
 * Calculates full enterprise color tokens derived from exactly TWO customizable colors (INK & BRAND).
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

export const PRESET_THEMES = [
  {
    id: 'coral-teal',
    name: '1. Coral & Teal',
    ink: '#0F766E',
    brand: '#FF6F61',
    description: 'Deep oceanic teal with vibrant sunlit coral',
  },
  {
    id: 'midnight-navy-lime',
    name: '2. Midnight Navy & Lime',
    ink: '#0B2D5B',
    brand: '#A3E635',
    description: 'Deep nocturnal navy with electric lime',
  },
  {
    id: 'plum-peach',
    name: '3. Plum & Peach',
    ink: '#4B0D3A',
    brand: '#FFA07A',
    description: 'Regal velvet plum with warm peach',
  },
  {
    id: 'forest-green-butter',
    name: '4. Forest Green & Butter',
    ink: '#13361B',
    brand: '#FCD34D',
    description: 'Lush dark forest green with rich golden butter',
  },
  {
    id: 'cherry-cola-vanilla',
    name: '5. Cherry Cola & Vanilla',
    ink: '#3B0A0A',
    brand: '#F3E0C3',
    description: 'Deep mahogany cherry cola with warm French vanilla',
  },
  {
    id: 'bistre-aureolin',
    name: '6. Bistre & Aureolin',
    ink: '#2E1A0F',
    brand: '#F1C40F',
    description: 'Warm bistre soot with brilliant aureolin cobalt yellow',
  },
  {
    id: 'forest-ink-amber-gold',
    name: '7. Forest Ink & Amber Gold',
    ink: '#0F2D1F',
    brand: '#D4A017',
    description: 'Executive dark forest ink with warm amber gold',
  },
  {
    id: 'midnight-slate-terracotta',
    name: '8. Midnight Slate & Terracotta',
    ink: '#1E293B',
    brand: '#D75A3E',
    description: 'Midnight slate blue with warm terracotta',
  },
  {
    id: 'imperial-navy-mustard-gold',
    name: '9. Imperial Navy & Mustard Gold',
    ink: '#0B1F3B',
    brand: '#E1B12C',
    description: 'Deep imperial navy with rich mustard gold',
  },
  {
    id: 'obsidian-vivid-emerald',
    name: '10. Obsidian & Vivid Emerald',
    ink: '#111111',
    brand: '#10B981',
    description: 'Deep pitch obsidian with vivid electric emerald',
  },
  {
    id: 'espresso-burnt-sienna',
    name: '11. Espresso & Burnt Sienna',
    ink: '#2B1B10',
    brand: '#C2410C',
    description: 'Rich dark espresso with radiant burnt sienna',
  },
];

/**
 * Applies a 2-color pair dynamically across the entire document
 */
export function applyTwoColorTheme(inkHex, brandHex, saveToStorage = true) {
  const root = document.documentElement;

  // Primary base colors
  root.style.setProperty('--color-ink', inkHex);
  root.style.setProperty('--color-brand', brandHex);

  // Derived from INK
  root.style.setProperty('--ink-primary', inkHex);
  root.style.setProperty('--ink-secondary', mixColors(inkHex, '#FFFFFF', 0.28));
  root.style.setProperty('--ink-tertiary', mixColors(inkHex, '#FFFFFF', 0.55));
  root.style.setProperty('--ink-muted', mixColors(inkHex, '#FFFFFF', 0.65));
  root.style.setProperty('--ink-border', mixColors(inkHex, '#FFFFFF', 0.87));
  root.style.setProperty('--ink-border-subtle', mixColors(inkHex, '#FFFFFF', 0.93));
  root.style.setProperty('--ink-surface-subtle', mixColors(inkHex, '#FFFFFF', 0.975));
  root.style.setProperty('--ink-surface-hover', mixColors(inkHex, '#FFFFFF', 0.955));
  root.style.setProperty('--ink-surface-active', mixColors(inkHex, '#FFFFFF', 0.91));
  root.style.setProperty('--ink-bg-canvas', '#FFFFFF');

  // Sidebar (derived from INK)
  root.style.setProperty('--sidebar-bg', inkHex);
  root.style.setProperty('--sidebar-surface', mixColors(inkHex, '#FFFFFF', 0.12));
  root.style.setProperty('--sidebar-surface-hover', mixColors(inkHex, '#FFFFFF', 0.20));
  root.style.setProperty('--sidebar-surface-active', mixColors(inkHex, '#FFFFFF', 0.26));
  root.style.setProperty('--sidebar-text', mixColors('#FFFFFF', inkHex, 0.18));
  root.style.setProperty('--sidebar-text-muted', mixColors('#FFFFFF', inkHex, 0.54));

  // Derived from BRAND
  root.style.setProperty('--brand-fill', brandHex);
  root.style.setProperty('--brand-hover', mixColors(brandHex, '#000000', 0.12));
  root.style.setProperty('--brand-active', mixColors(brandHex, '#000000', 0.22));
  root.style.setProperty('--brand-tint', mixColors(brandHex, '#FFFFFF', 0.88));
  root.style.setProperty('--brand-tint-strong', mixColors(brandHex, '#FFFFFF', 0.78));
  root.style.setProperty('--brand-border', mixColors(brandHex, '#FFFFFF', 0.68));

  // Contrast text for brand buttons
  const lum = getLuminance(brandHex);
  const contrastText = lum > 0.4 ? inkHex : '#FFFFFF';
  root.style.setProperty('--brand-contrast-text', contrastText);

  // Focus ring
  root.style.setProperty('--focus-ring', `0 0 0 2px #FFFFFF, 0 0 0 4px ${brandHex}`);

  // Legacy page CSS compatibility
  root.style.setProperty('--c-gold', brandHex);
  root.style.setProperty('--c-gold-dark', mixColors(brandHex, '#000000', 0.15));
  root.style.setProperty('--c-gold-tint', mixColors(brandHex, '#FFFFFF', 0.85));
  root.style.setProperty('--c-charcoal', inkHex);
  root.style.setProperty('--c-bg', '#FFFFFF');
  root.style.setProperty('--c-text', inkHex);
  root.style.setProperty('--color-primary', brandHex);
  root.style.setProperty('--color-primary-dark', mixColors(brandHex, '#000000', 0.15));
  root.style.setProperty('--color-primary-light', mixColors(brandHex, '#FFFFFF', 0.85));
  root.style.setProperty('--color-background', '#FFFFFF');
  root.style.setProperty('--org-bg-main', '#FFFFFF');
  root.style.setProperty('--page-bg', '#FFFFFF');
  root.style.setProperty('--primary', brandHex);
  root.style.setProperty('--primary-dark', mixColors(brandHex, '#000000', 0.15));
  root.style.setProperty('--primary-light', mixColors(brandHex, '#FFFFFF', 0.85));
  root.style.setProperty('--primary-subtle', mixColors(brandHex, '#FFFFFF', 0.88));
  root.style.setProperty('--primary-gradient', brandHex);
  root.style.setProperty('--pm-primary', brandHex);
  root.style.setProperty('--pm-secondary', '#FFFFFF');
  root.style.setProperty('--pm-border', mixColors(inkHex, '#FFFFFF', 0.87));
  root.style.setProperty('--pm-border-light', mixColors(inkHex, '#FFFFFF', 0.93));
  root.style.setProperty('--color-sidebar', inkHex);
  root.style.setProperty('--color-border', mixColors(inkHex, '#FFFFFF', 0.87));

  if (saveToStorage) {
    try {
      localStorage.setItem('teamhub_custom_ink', inkHex);
      localStorage.setItem('teamhub_custom_brand', brandHex);
    } catch {
      // ignore
    }
  }
}

/**
 * Manages Surface Style: 'classic' (flat & hairline) vs 'neumorphic' (soft tactile 3D)
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
 * Initializes saved theme from localStorage on app boot
 */
export function initSavedTheme() {
  try {
    const savedInk = localStorage.getItem('teamhub_custom_ink');
    const savedBrand = localStorage.getItem('teamhub_custom_brand');
    initSurfaceStyle();
    if (savedInk && savedBrand) {
      applyTwoColorTheme(savedInk, savedBrand, false);
      return { ink: savedInk, brand: savedBrand };
    }
  } catch {
    // ignore
  }
  return { ink: '#0F1F18', brand: '#C7882C' };
}

