// components/ui/Card.tsx - BCKP Style
import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, padding }) => {
  const { colors, spacing } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: padding !== undefined ? padding : spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};
