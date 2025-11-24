// components/RatingDisplay.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type RatingDisplayProps = {
  averageRating: number;
  reviewCount: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
};

export function RatingDisplay({ 
  averageRating, 
  reviewCount, 
  size = 'medium',
  color = '#FFD700'
}: RatingDisplayProps) {
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const starSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  
  // Round to 1 decimal
  const rating = Math.round(averageRating * 10) / 10;
  
  if (reviewCount === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="star-outline" size={starSize} color="#999" />
        <Text style={{ fontSize: fontSize - 2, color: '#999' }}>
          Noch keine Bewertungen
        </Text>
      </View>
    );
  }
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name="star" size={starSize} color={color} />
      <Text style={{ fontSize, fontWeight: '700', color: '#000' }}>
        {rating.toFixed(1)}
      </Text>
      <Text style={{ fontSize: fontSize - 2, color: '#666' }}>
        ({reviewCount} {reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
      </Text>
    </View>
  );
}
