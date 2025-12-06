import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  purple: '#7C5CFF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.5)',
  card: '#252041',
};

interface TabButtonProps {
  label: string;
  focused: boolean;
  onPress: () => void;
  badge?: number;
}

export function TabButton({ label, focused, onPress, badge }: TabButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginBottom: Math.max(insets.bottom, 6),
        position: 'relative',
      }}
    >
      <View
        style={{
          backgroundColor: focused ? COLORS.purple : 'transparent',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 70,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: focused ? COLORS.white : COLORS.inactive,
          }}
        >
          {label}
        </Text>
      </View>
      
      {/* Badge für Notifications */}
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#FF4444',
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontSize: 10,
              fontWeight: '700',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
