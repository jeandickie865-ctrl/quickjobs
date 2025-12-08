import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/colors";

export const ArrowDoodle = ({ size = 150 }) => {
  return (
    <View style={{ 
      width: size, 
      height: size * 1.2,
      opacity: 0.85,
    }}>
      <Svg 
        width={size} 
        height={size * 1.2} 
        viewBox="0 0 200 240"
      >
        {/* Organischer geschwungener Pfeil - von oben nach unten rechts */}
        <Path
          d="M 50,30 C 80,20 120,25 140,50 C 155,70 150,100 135,120 C 125,135 115,145 110,155"
          stroke={COLORS.accent}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Pfeilspitze */}
        <Path
          d="M 110,155 L 105,170 L 120,163"
          stroke={COLORS.accent}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};
