// components/ui/Card.tsx - VIVID BLUE-PURPLE & NEON LIME
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
    borderRadius: 22,
    padding: padding !== undefined ? padding : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};
