// components/ui/Button.tsx - VIVID BLUE-PURPLE & NEON LIME
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, Animated } from 'react-native';
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
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
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
          backgroundColor: '#FF773D', // Orange
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.accent,
          minHeight: 54,
          borderRadius: 14,
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
          backgroundColor: '#FF4E4E',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    };

    if (disabled || loading) {
      return { ...base, color: colors.gray500 };
    }

    switch (variant) {
      case 'primary':
        return { ...base, color: colors.white }; // White text on purple
      case 'secondary':
        return { ...base, color: colors.accent };
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
    return 0.97; // Scale effect
  };

  const getLoadingColor = (): string => {
    if (variant === 'primary') {
      return colors.white;
    }
    if (variant === 'danger') {
      return colors.white;
    }
    return colors.accent;
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
