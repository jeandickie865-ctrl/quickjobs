import React from "react";
import { Image } from "react-native";
import { COLORS } from "../constants/colors";

export const ArrowDoodle = ({ size = 150 }) => (
  <Image
    source={require("../assets/arrow-purple.png")}
    style={{
      width: size,
      height: size,
      resizeMode: "contain",
      tintColor: COLORS.accent,
    }}
  />
);
