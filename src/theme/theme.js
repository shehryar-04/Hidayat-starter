/**
 * Hidayat Centralized Design Tokens & Theme Specification
 * 
 * Provides semantic tokens for colors, typography, spacing, border radii,
 * shadows, transitions, z-indexes, and responsive breakpoints.
 */

export const colors = {
  light: {
    // Brand / Primary (Hidayat Emerald)
    primary: '#2d8659',
    primaryHover: '#206f47',
    primaryActive: '#18593a',
    primaryLight: '#f0faf5',
    primarySubtle: '#d9f2e6',
    primaryBorder: '#aee0c9',
    primaryForeground: '#ffffff',

    // Secondary / Neutral Accent
    secondary: '#4b5563',
    secondaryHover: '#374151',
    secondaryLight: '#f1f3f6',
    secondaryForeground: '#ffffff',

    // Layout Backgrounds & Surfaces
    background: '#f8f9fb',
    backgroundSubtle: '#f1f3f6',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceHover: '#f8f9fb',
    surfaceSubtle: '#f9fafb',

    // Borders & Dividers
    border: '#e2e5eb',
    borderSubtle: '#f1f3f6',
    borderStrong: '#cfd3da',
    borderFocus: '#2d8659',

    // Typography & Text
    text: '#111826',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    textSubtle: '#9ba2b0',
    textInverse: '#ffffff',
    textPrimary: '#2d8659',

    // Form Inputs & Controls
    inputBackground: '#ffffff',
    inputBorder: '#e2e5eb',
    inputText: '#111826',
    inputPlaceholder: '#9ba2b0',
    disabledBackground: '#f1f3f6',
    disabledText: '#9ba2b0',
    disabledBorder: '#e2e5eb',

    // Status: Success
    success: '#10b981',
    successHover: '#059669',
    successLight: '#ecfdf5',
    successBorder: '#a7f3d0',
    successForeground: '#065f46',

    // Status: Warning
    warning: '#f59e0b',
    warningHover: '#d97706',
    warningLight: '#fffbeb',
    warningBorder: '#fde68a',
    warningForeground: '#92400e',

    // Status: Danger / Error
    danger: '#ef4444',
    dangerHover: '#dc2626',
    dangerLight: '#fef2f2',
    dangerBorder: '#fecaca',
    dangerForeground: '#991b1b',

    // Status: Info
    info: '#3b82f6',
    infoHover: '#2563eb',
    infoLight: '#eff6ff',
    infoBorder: '#bfdbfe',
    infoForeground: '#1e40af',

    // Overlays & Backdrop
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlaySubtle: 'rgba(0, 0, 0, 0.25)',
    overlayStrong: 'rgba(0, 0, 0, 0.75)',
  },

  dark: {
    // Brand / Primary (Vibrant Emerald for high dark contrast)
    primary: '#38b273',
    primaryHover: '#47c785',
    primaryActive: '#65d99b',
    primaryLight: '#0d2418',
    primarySubtle: '#091c13',
    primaryBorder: '#1c4a33',
    primaryForeground: '#04140c',

    // Secondary / Neutral Accent
    secondary: '#94a3b8',
    secondaryHover: '#cbd5e1',
    secondaryLight: '#14221b',
    secondaryForeground: '#ffffff',

    // Layout Backgrounds & Surfaces (Deep Forest Black & Dark Green Slate)
    background: '#070d0a',
    backgroundSubtle: '#0c1410',
    surface: '#0f1a14',
    surfaceElevated: '#14221b',
    surfaceHover: '#182b22',
    surfaceSubtle: '#0a120e',

    // Borders & Dividers
    border: '#1a2e23',
    borderSubtle: '#132219',
    borderStrong: '#254433',
    borderFocus: '#38b273',

    // Typography & Text
    text: '#f8f9fb',
    textSecondary: '#cfd3da',
    textMuted: '#9ba2b0',
    textSubtle: '#6b7280',
    textInverse: '#111826',
    textPrimary: '#47ae7a',

    // Form Inputs & Controls
    inputBackground: '#0f1a14',
    inputBorder: '#1a2e23',
    inputText: '#f8f9fb',
    inputPlaceholder: '#6b7280',
    disabledBackground: '#14221b',
    disabledText: '#6b7280',
    disabledBorder: '#1a2e23',

    // Status: Success
    success: '#34d399',
    successHover: '#6ee7b7',
    successLight: '#064e3b',
    successBorder: '#065f46',
    successForeground: '#a7f3d0',

    // Status: Warning
    warning: '#fbbf24',
    warningHover: '#fcd34d',
    warningLight: '#78350f',
    warningBorder: '#92400e',
    warningForeground: '#fde68a',

    // Status: Danger / Error
    danger: '#f87171',
    dangerHover: '#fca5a5',
    dangerLight: '#7f1d1d',
    dangerBorder: '#991b1b',
    dangerForeground: '#fecaca',

    // Status: Info
    info: '#60a5fa',
    infoHover: '#93c5fd',
    infoLight: '#1e3a8a',
    infoBorder: '#1e40af',
    infoForeground: '#bfdbfe',

    // Overlays & Backdrop
    overlay: 'rgba(0, 0, 0, 0.75)',
    overlaySubtle: 'rgba(0, 0, 0, 0.5)',
    overlayStrong: 'rgba(0, 0, 0, 0.9)',
  }
}

export const typography = {
  fontFamilies: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    urdu: '"Jameel Noori Nastaleeq", serif',
    arabic: '"Amiri", "Traditional Arabic", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSizes: {
    '2xs': '0.625rem', // 10px
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    urdu: '2.4',
    arabic: '2.05',
  },
}

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
}

export const radii = {
  none: '0px',
  xs: '0.125rem', // 2px
  sm: '0.25rem',  // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  '3xl': '1.5rem',// 24px
  full: '9999px',
}

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.06)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
}

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
}

export const transitions = {
  durations: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
  easings: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

export const theme = {
  colors: colors.light,
  colorsDark: colors.dark,
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
  transitions,
  breakpoints,
}

export default theme
