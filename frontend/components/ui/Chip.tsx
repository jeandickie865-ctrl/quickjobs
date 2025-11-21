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
  
  // Urban Neutral Style
  const bg = selected ? colors.primary : (tone === 'solid' ? colors.gray100 : 'transparent');
  const fg = selected ? colors.white : colors.black;
  const border = selected ? colors.primary : colors.gray300;
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 999, 
        borderWidth: 1, 
        borderColor: border, 
        backgroundColor: bg 
      }}
    >
      <Text style={{ color: fg, fontSize: 13, fontWeight: selected ? '600' : '500' }}>{label}</Text>
    </Pressable>
  );
}