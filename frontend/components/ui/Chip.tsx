import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export default function Chip({ 
  label, 
  selected = false, 
  tone = 'solid', 
  onPress 
}: {
  label: string; 
  selected?: boolean; 
  tone?: 'solid' | 'outline'; 
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const bg = selected ? colors.gray900 : (tone === 'solid' ? colors.beige100 : 'transparent');
  const fg = selected ? colors.white : colors.black;
  const border = selected ? colors.gray900 : colors.gray200;
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ 
        paddingVertical: 6, 
        paddingHorizontal: 10, 
        borderRadius: 999, 
        borderWidth: 1, 
        borderColor: border, 
        backgroundColor: bg 
      }}
    >
      <Text style={{ color: fg, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}