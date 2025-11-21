export const palette = {
  // ===== URBAN NEUTRAL STYLE =====
  
  // Primary Green (Urban Neutral)
  primary: '#4A7C59',
  primaryDark: '#3C6648',
  primaryLight: '#DDE8E1',
  primaryUltraLight: '#F5F6F4',
  
  // Neutrals
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray900: '#333333',
  gray700: '#6F6F6F',
  gray500: '#9E9E9E',
  gray300: '#CECECE',
  gray200: '#E8E8E8',
  gray100: '#F5F5F5',
  
  // Accent (warm-neutral, sparsam)
  accent: '#D95F59',
  accentLight: '#F7E8E6',
  
  // State Colors
  success: '#4A7C59',        // Gleich wie primary, einheitlich
  successLight: '#E5EFE9',
  warning: '#E0A63E',
  warningLight: '#FFF5D9',
  error: '#D9534F',
  errorLight: '#FFE8E8',
  
  // Backgrounds
  background: '#F5F6F4',
  card: '#FFFFFF',
  
  // Beige (backward compatibility)
  beige50: '#F5F6F4',
  beige100: '#DDE8E1',
  beige200: '#E8E8E8',
  beige300: '#CECECE',
  
  // Info (für Notifications)
  info: '#4A7C59',
  infoLight: '#E5EFE9',
  
  // Match strength
  matchPerfect: '#4A7C59',
  matchGood: '#4A7C59',
  matchBasic: '#6F6F6F',
  
  // Disabled
  disabled: '#9E9E9E',
  disabledBg: '#F5F5F5',
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