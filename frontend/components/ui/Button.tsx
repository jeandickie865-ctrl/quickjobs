import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { colors, spacing, radius } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.default,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    };

    if (disabled) {
      return { ...base, backgroundColor: colors.gray200, opacity: 0.6 };
    }

    switch (variant) {
      case 'primary':
        return { 
          ...base, 
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 2,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.beige100,
          borderWidth: 1,
          borderColor: colors.beige300,
        };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
    };

    if (disabled) {
      return { ...base, color: colors.gray400 };
    }

    switch (variant) {
      case 'primary':
        return { ...base, color: colors.white };
      case 'secondary':
        return { ...base, color: colors.black };
      case 'ghost':
        return { ...base, color: colors.gray700 };
      default:
        return base;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.black} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};