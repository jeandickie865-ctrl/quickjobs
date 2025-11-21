export const palette = {
  // Primary Green
  primary: '#2F5F3F',
  primaryLight: '#DDE8E1',
  primaryUltraLight: '#F4F7F5',
  
  // Accent
  accent: '#7FA68A',
  
  // Status
  error: '#C54B4B',
  errorLight: '#F9D9D9',
  success: '#2F5F3F',
  successLight: '#DDE8E1',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  
  // Neutrals
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray900: '#1A1A1A',
  gray600: '#6D6D6D',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
  gray100: '#F5F5F5',
  
  // Transparency
  overlay: 'rgba(26, 26, 26, 0.75)',
  backdropLight: 'rgba(255, 255, 255, 0.95)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 9999,
};

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Radius = typeof radius;