import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function CategoryCard({ 
  title, 
  count, 
  onPress 
}: { 
  title: string; 
  count: number; 
  onPress: () => void;
}) {
  const { colors } = useTheme();
  
  return (
    <Pressable 
      onPress={onPress} 
      style={{ 
        flex: 1, 
        minHeight: 88, 
        borderWidth: 1, 
        borderColor: colors.gray200, 
        borderRadius: 12, 
        backgroundColor: colors.beige50, 
        padding: 12, 
        margin: 6 
      }}
    >
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.gray700, fontSize: 12 }}>{count} Tags</Text>
      </View>
    </Pressable>
  );
}