// components/ui/Input.tsx - Green Modern Minimal with Eye Icon
import React, { useState } from 'react';
import { TextInput, View, Text, Pressable, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Eye, EyeOff } from '../Icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  showPasswordToggle = false,
  secureTextEntry,
  ...textInputProps
}) => {
  const { colors, spacing } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecure = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  const containerStyles: ViewStyle = {
    marginBottom: spacing.md,
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 6,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: error ? colors.error : colors.gray300,
    minHeight: 52,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.black,
  };

  const errorStyle: TextStyle = {
    fontSize: 13,
    color: colors.error,
    marginTop: 6,
    fontWeight: '500',
  };

  return (
    <View style={[containerStyles, containerStyle]}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          style={[inputStyle, style]}
          placeholderTextColor={colors.gray600}
          secureTextEntry={isSecure}
          {...textInputProps}
        />
        {showPasswordToggle && (
          <Pressable 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ paddingHorizontal: spacing.md }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.gray600} />
            ) : (
              <Eye size={20} color={colors.gray600} />
            )}
          </Pressable>
        )}
      </View>
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};