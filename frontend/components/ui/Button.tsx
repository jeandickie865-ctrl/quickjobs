// components/ui/Button.tsx - BCKP Style
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
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
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
    };

    if (disabled || loading) {
      return { 
        ...base, 
        backgroundColor: colors.gray200,
        borderWidth: 0,
      };
    }

    switch (variant) {
      case 'primary':
        return { 
          ...base, 
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.white,
          borderWidth: 1.3,
          borderColor: colors.primary,
        };
      case 'ghost':
        return { 
          ...base, 
          backgroundColor: 'transparent',
          paddingVertical: 12,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.error,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0,
    };

    if (disabled || loading) {
      return { ...base, color: colors.gray500 };
    }

    switch (variant) {
      case 'primary':
        return { ...base, color: colors.white };
      case 'secondary':
        return { ...base, color: colors.primary };
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
    return 0.7;
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
