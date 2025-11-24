import React, { createContext, useContext, ReactNode } from 'react';
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