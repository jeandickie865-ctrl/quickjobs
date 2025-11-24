// components/StarRating.tsx
import React from 'react';
import { View, Text } from 'react-native';

type StarRatingProps = {
  rating: number; // 0-5
  size?: number;
  showNumber?: boolean;
};

export function StarRating({ rating, size = 16, showNumber = false }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Text key={`full-${i}`} style={{ fontSize: size }}>
          ⭐
        </Text>
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <Text style={{ fontSize: size }}>⭐</Text>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Text key={`empty-${i}`} style={{ fontSize: size, opacity: 0.3 }}>
          ⭐
        </Text>
      ))}

      {/* Show numeric rating */}
      {showNumber && (
        <Text style={{ fontSize: size - 2, fontWeight: '600', marginLeft: 4 }}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
