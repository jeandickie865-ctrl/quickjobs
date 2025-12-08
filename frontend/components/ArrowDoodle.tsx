import React from "react";
import { Image } from "react-native";
import { COLORS } from "../constants/colors";

export const ArrowDoodle = ({ size = 160 }) => {
  return (
    <Image
      source={require('../assets/decor-arrow.png')}
      style={{
        width: size,
        height: size,
        position: 'absolute',
        top: 20,
        right: 20,
        opacity: 0.4,
        tintColor: COLORS.accent,
      }}
    />
  );
};
