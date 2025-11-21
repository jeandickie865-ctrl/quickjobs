export const palette = {
  // ===== STIL 1: MODERN, KLAR, HOCHWERTIG, VC-READY =====
  
  // Primary (Markenfarbe)
  primary: '#3F6F3D',           // Primary Green
  primaryDark: '#2F5A32',       // Primary Green Dark
  primaryLight: '#E9F3EB',      // Primary Light
  primaryUltraLight: '#F5FAF6', // Primary Very Light
  
  // Neutral
  black: '#111111',
  white: '#FFFFFF',
  gray900: '#1A1A1A',
  gray700: '#4A4A4A',
  gray500: '#7A7A7A',
  gray300: '#D7D7D7',
  gray200: '#EAEAEA',
  gray100: '#F5F5F5',
  
  // System Colors
  success: '#0E9F6E',
  successLight: '#E9F3EB',
  warning: '#F7C948',
  warningLight: '#FFF8E5',
  warningBorder: '#F1E3B8',
  warningText: '#6F5D2A',
  error: '#E53E3E',
  errorLight: '#FFE8E8',
  info: '#3182CE',
  infoLight: '#E6F4FF',
  
  // Backgrounds
  background: '#FAFAF7',        // App Background
  card: '#FFFFFF',              // Card Background
  
  // Backward compatibility
  beige50: '#F5FAF6',
  beige100: '#E9F3EB',
  beige200: '#EAEAEA',
  beige300: '#D7D7D7',
  accent: '#3F6F3D',
  accentLight: '#E9F3EB',
  
  // Match & Rating
  matchPerfect: '#0E9F6E',
  matchGood: '#3F6F3D',
  matchBasic: '#7A7A7A',
  ratingGold: '#F7C948',
  
  // Disabled
  disabled: '#7A7A7A',
  disabledBg: '#F5F5F5',
  
  // Borders
  border: '#EBEBEB',
  borderLight: '#D7D7D7',
  
  // Rating Background
  ratingBg: '#F5FAF6',
  ratingBorder: '#E1EDE3',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const radius = {
  default: 14,
  card: 16,
};

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Radius = typeof radius;