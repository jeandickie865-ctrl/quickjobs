import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../constants/colors';

export function TabButton({ label, focused, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: focused ? COLORS.neon : 'transparent',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: focused ? 0 : 1.5,
        borderColor: COLORS.border,
        marginHorizontal: 4,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: focused ? '#000000' : COLORS.inactive,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
