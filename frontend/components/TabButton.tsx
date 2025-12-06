import { TouchableOpacity, View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

export function TabButton({ label, focused, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginHorizontal: 6,
        paddingBottom: 2,
      }}
    >
      <View
        style={{
          backgroundColor: focused ? COLORS.neon : COLORS.card,
          paddingVertical: 8,
          paddingHorizontal: 18,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: focused ? 0 : 1,
          borderColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: focused ? COLORS.white : COLORS.inactive,
          }}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
