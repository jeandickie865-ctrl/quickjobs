import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({ label, selected = false, onPress, style }) => {
  const { colors, spacing, radius } = useTheme();

  const tagStyle: ViewStyle = {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.default,
    backgroundColor: selected ? colors.black : colors.beige100,
    borderWidth: 1,
    borderColor: selected ? colors.black : colors.beige300,
  };

  const textStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '500',
    color: selected ? colors.white : colors.gray700,
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component style={[tagStyle, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={textStyle}>{label}</Text>
    </Component>
  );
};