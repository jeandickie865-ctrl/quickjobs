import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const { colors, spacing, radius } = useTheme();

  const inputStyle: TextStyle = {
    backgroundColor: colors.white,
    borderRadius: radius.default,
    borderWidth: 1,
    borderColor: error ? colors.gray900 : colors.gray200,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.black,
    minHeight: 48,
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  };

  const errorStyle: TextStyle = {
    fontSize: 12,
    color: colors.gray700,
    marginTop: spacing.xs,
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <TextInput
        style={[inputStyle, style]}
        placeholderTextColor={colors.gray400}
        {...textInputProps}
      />
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};