// theme/palette.ts - NEON TECH UI SYSTEM
export const palette = {
  // ===== CORE BRAND COLORS =====
  // Primary - BACKUP Purple
  primary: '#5941FF',
  primaryDark: '#4530E0',
  primaryLight: '#7B68FF',
  
  // Accent - BACKUP Neon Lime
  neon: '#C8FF16',
  neonDark: '#B3E612',
  neonLight: '#D4FF4D',
  accent: '#C8FF16',
  
  // ===== BACKGROUNDS =====
  background: '#5941FF',        // Global background - always purple
  screenBg: '#5941FF',          // Screen background
  cardBg: '#FFFFFF',            // White cards on purple
  inputBg: '#FFFFFF',           // White input fields
  
  // ===== TEXT COLORS =====
  text: '#FFFFFF',              // Default text (on purple background)
  textOnCard: '#000000',        // Text on white cards/inputs
  textOnNeon: '#000000',        // Text on neon buttons
  label: '#C8FF16',             // Labels - always neon
  heading: '#FFFFFF',           // Headlines
  caption: '#CCCCCC',           // Muted text
  
  // ===== SEMANTIC COLORS =====
  black: '#000000',
  white: '#FFFFFF',
  gray900: '#1A1A1A',
  gray700: '#4A4A4A',
  gray600: '#666666',
  gray500: '#8A8A8A',
  gray400: '#A0A0A0',
  gray300: '#D0D0D0',
  gray200: '#E8E8E8',
  gray100: '#F5F5F5',
  
  // ===== STATUS COLORS =====
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#5941FF',
  infoLight: '#E8E4FF',
  disabled: '#999999',
  disabledBg: '#F0F0F0',
  
  // ===== SPECIAL EFFECTS =====
  neonGlow: 'rgba(200, 255, 22, 0.4)',   // Glow effect for borders
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
  neonGlow: {
    shadowColor: '#C8FF16',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ===== NEON TECH COMPONENT STYLES =====
export const components = {
  // Primary Button - Neon Lime with black text
  buttonPrimary: {
    backgroundColor: '#C8FF16',
    color: '#000000',
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 24,
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Secondary Button - Purple with Neon border & text
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#C8FF16',
    borderWidth: 2,
    color: '#C8FF16',
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 24,
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Text Input - White background with purple border
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#5941FF',
    borderWidth: 2,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: '#000000',
    fontSize: 16,
  },
  
  // Card - Purple background with Neon border and glow
  card: {
    backgroundColor: '#5941FF',
    borderColor: '#C8FF16',
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
  },
  
  // White Card - for content on purple background
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  
  // Avatar - with Neon border
  avatar: {
    borderColor: '#C8FF16',
    borderWidth: 4,
    borderRadius: 9999,
  },
  
  // Label - Neon text
  label: {
    color: '#C8FF16',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
};
