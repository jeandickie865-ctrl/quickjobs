// components/ui/Chip.tsx - LILA ORANGE ROSA
import React from 'react';
import { Pressable, Text } from 'react-native';

const CHIP_COLORS = {
  primary: '#9333EA',      // Lila
  primaryLight: '#F3E8FF', // Sehr helles Lila
  secondary: '#FF773D',    // Orange
  secondaryLight: '#FFF4ED', // Sehr helles Orange
  accent: '#EFABFF',       // Rosa
  accentLight: '#FCE7FF',  // Sehr helles Rosa
  border: '#E9D5FF',       // Lila Border
  text: '#1A1A1A',         // Dunkelgrau
  textLight: '#6B7280',    // Grau
};

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
  // Barrierefreies Design mit gutem Kontrast
  const bg = selected ? CHIP_COLORS.primary : CHIP_COLORS.primaryLight;
  const fg = selected ? '#FFFFFF' : CHIP_COLORS.text;
  const border = selected ? CHIP_COLORS.primary : CHIP_COLORS.border;
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        borderWidth: 2, 
        borderColor: border, 
        backgroundColor: bg 
      }}
    >
      <Text style={{ color: fg, fontSize: 14, fontWeight: selected ? '700' : '600' }}>{label}</Text>
    </Pressable>
  );
}
