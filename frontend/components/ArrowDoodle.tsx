import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/colors";

export const ArrowDoodle = ({ size = 150 }) => {
  const scale = size / 220;
  
  return (
    <View style={{ 
      width: size, 
      height: size * 0.64, // 140/220 ratio
      opacity: 0.9,
    }}>
      <Svg 
        width={size} 
        height={size * 0.64} 
        viewBox="0 0 220 140"
      >
        {/* Geschwungener Pfeil */}
        <Path
          d="M15 60 C60 10, 140 10, 180 60 C200 85, 180 110, 150 90"
          stroke={COLORS.accent}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pfeilspitze */}
        <Path
          d="M150 90 L165 95 L155 110"
          stroke={COLORS.accent}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};
