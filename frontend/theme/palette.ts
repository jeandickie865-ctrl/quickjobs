// theme/palette.ts - VIVID BLUE-PURPLE & NEON LIME
export const palette = {
  // Primary Colors - Vivid Blue-Purple
  primary: '#5941FF',
  primaryDark: '#4530E0',
  primaryLight: '#E8E4FF',
  
  // Accent - Neon Lime
  accent: '#C8FF16',
  accentDark: '#B3E612',
  accentLight: '#F4FFD4',
  
  // Background & Cards
  background: '#5941FF',
  card: '#FFFFFF',
  white: '#FFFFFF',
  primaryUltraLight: '#F8F8F8',
  beige50: '#F8F8F8',
  beige100: '#EFEFEF',
  
  // Text
  text: '#FFFFFF',
  black: '#000000',
  textMuted: '#CCCCCC',
  gray900: '#1F1F1F',
  gray700: '#4A4A4A',
  gray600: '#666666',
  gray500: '#8A8A8A',
  gray300: '#D0D0D0',
  gray200: '#E8E8E8',
  gray100: '#F5F5F5',
  
  // Status
  success: '#5941FF',
  successLight: '#E8E4FF',
  warning: '#C8FF16',
  warningLight: '#F4FFD4',
  danger: '#E34242',
  error: '#E34242',
  errorLight: '#FBECEC',
  info: '#5941FF',
  infoLight: '#E8E4FF',
  disabled: '#999999',
  disabledBg: '#F0F0F0',
  
  // Transparency
  overlay: 'rgba(0, 0, 0, 0.75)',
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
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Headlines - Inter ExtraBold
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Body - Inter Regular
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Micro - Inter Medium
  micro: {
    fontSize: 13,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
  },
};

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
