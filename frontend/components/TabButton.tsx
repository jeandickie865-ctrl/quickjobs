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
  icon: React.ReactNode;
  focused: boolean;
  onPress: () => void;
  badge?: number;
}

export function TabButton({ label, icon, focused, onPress, badge }: TabButtonProps) {
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
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 70,
        }}
      >
        {icon}
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: focused ? COLORS.white : COLORS.inactive,
            marginTop: 4,
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
