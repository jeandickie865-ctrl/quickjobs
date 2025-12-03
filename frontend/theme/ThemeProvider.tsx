import React, { createContext, useContext, ReactNode } from 'react';

// ===== BACKUP DESIGN SYSTEM =====
export const BACKUP_COLORS = {
  purple: "#5941FF",
  neon: "#C8FF16",
  dark: "#0A0A14",
  white: "#FFFFFF",
  border: "rgba(255,255,255,0.06)",
};

export const BACKUP_CARD = {
  backgroundColor: "#14141F",
  borderRadius: 20,
  borderWidth: 1,
  borderColor: BACKUP_COLORS.border,
  padding: 18,
};

export const BACKUP_BUTTON_PRIMARY = {
  width: "60%",
  alignSelf: "center" as const,
  backgroundColor: BACKUP_COLORS.neon,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: "center" as const,
};

export const BACKUP_BUTTON_SECONDARY = {
  width: "60%",
  alignSelf: "center" as const,
  borderWidth: 2,
  borderColor: BACKUP_COLORS.purple,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: "center" as const,
};

export const BACKUP_BUTTON_TERTIARY = {
  width: "60%",
  alignSelf: "center" as const,
  borderWidth: 2,
  borderColor: BACKUP_COLORS.neon,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: "center" as const,
};

import { palette, spacing, radius, Palette, Spacing, Radius } from './palette';

interface ThemeContextValue {
  colors: Palette;
  spacing: Spacing;
  radius: Radius;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value: ThemeContextValue = {
    colors: palette,
    spacing,
    radius,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};