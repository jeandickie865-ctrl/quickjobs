export const palette = {
  // Basic colors
  black: '#0B0B0B',
  white: '#FFFFFF',
  
  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray900: '#171717',
  
  // Beige (neutral, warm)
  beige50: '#F8F6F2',
  beige100: '#F2EDE5',
  beige200: '#E8E2D6',
  beige300: '#D6CBBE',
  
  // Primary (Blau)
  primary: '#0066FF',
  primaryDark: '#0052CC',
  primaryLight: '#3384FF',
  
  // Status colors
  success: '#10B981',      // Grün für "Akzeptiert"
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Gelb/Orange für "Beworben"
  warningLight: '#FEF3C7',
  error: '#EF4444',        // Rot für Fehler
  errorLight: '#FEE2E2',
  info: '#3B82F6',         // Blau für Info
  infoLight: '#DBEAFE',
  
  // Match strength
  matchPerfect: '#10B981',    // Grün
  matchGood: '#3B82F6',       // Blau
  matchBasic: '#8B5CF6',      // Lila
  
  // Disabled
  disabled: '#9CA3AF',
  disabledBg: '#F3F4F6',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const radius = {
  default: 12,
};

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Radius = typeof radius;