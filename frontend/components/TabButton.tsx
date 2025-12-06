import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

export function TabButton({ label, focused, onPress, badge }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
      <View
        style={{
          backgroundColor: focused ? COLORS.neon : 'transparent',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 16,
          borderWidth: focused ? 0 : 1.5,
          borderColor: focused ? 'transparent' : COLORS.border,
          minWidth: 80,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: focused ? '#000000' : COLORS.inactive,
          }}
        >
          {label}
        </Text>
        {badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: '#FF4444',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '700' }}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
