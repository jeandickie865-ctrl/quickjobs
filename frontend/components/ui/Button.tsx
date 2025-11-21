import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

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
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    };

    if (disabled || loading) {
      return { 
        ...base, 
        backgroundColor: colors.disabledBg,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: colors.disabled,
        opacity: 0.6,
      };
    }

    switch (variant) {
      case 'primary':
        return { 
          ...base, 
          backgroundColor: colors.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
      case 'ghost':
        return { 
          ...base, 
          backgroundColor: 'transparent',
          paddingVertical: spacing.sm,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.error,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
    };

    if (disabled || loading) {
      return { ...base, color: colors.disabled };
    }

    switch (variant) {
      case 'primary':
        return { ...base, color: colors.white };
      case 'secondary':
        return { ...base, color: colors.black };
      case 'ghost':
        return { ...base, color: colors.primary, fontWeight: '500' };
      case 'danger':
        return { ...base, color: colors.white };
      default:
        return base;
    }
  };

  const getActiveOpacity = (): number => {
    if (disabled || loading) return 1;
    return variant === 'ghost' ? 0.5 : 0.7;
  };

  const getLoadingColor = (): string => {
    if (variant === 'primary' || variant === 'danger') {
      return colors.white;
    }
    return colors.primary;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={getActiveOpacity()}
    >
      {loading ? (
        <ActivityIndicator color={getLoadingColor()} size="small" />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};