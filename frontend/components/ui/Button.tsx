// components/ui/Button.tsx - BCKP BOLD STARTUP
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
      paddingVertical: 18,
      paddingHorizontal: 24,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 54,
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.white,
          borderWidth: 2,
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
          backgroundColor: colors.danger,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 3,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
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
        return { ...base, color: colors.primary, fontWeight: '600' };
      case 'danger':
        return { ...base, color: colors.white };
      default:
        return base;
    }
  };

  const getActiveOpacity = (): number => {
    if (disabled || loading) return 1;
    return 0.8;
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
