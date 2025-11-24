// components/ui/Chip.tsx - VIVID BLUE-PURPLE & NEON LIME
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
  
  // Neon Lime Style
  const bg = selected ? colors.accent : (tone === 'solid' ? colors.gray100 : 'transparent');
  const fg = selected ? '#111111' : colors.black;
  const border = selected ? colors.accent : (tone === 'outline' ? colors.accent : colors.gray300);
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 14, 
        borderWidth: tone === 'outline' || selected ? 2 : 1, 
        borderColor: border, 
        backgroundColor: bg 
      }}
    >
      <Text style={{ color: fg, fontSize: 13, fontWeight: selected ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}
