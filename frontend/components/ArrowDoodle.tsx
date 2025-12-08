import React from "react";
import { Image, View } from "react-native";
import { COLORS } from "../constants/colors";

export const ArrowDoodle = ({ size = 150 }) => (
  <View style={{ 
    width: size, 
    height: size,
  }}>
    <Image
      source={require("../assets/arrow-purple.png")}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
        opacity: 0.9,
      }}
    />
  </View>
);
