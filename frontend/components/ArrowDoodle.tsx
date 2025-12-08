import React from "react";
import { Image, View } from "react-native";

export const ArrowDoodle = ({ size = 150 }) => {
  return (
    <View style={{ 
      width: size, 
      height: size,
      opacity: 0.9,
    }}>
      <Image
        source={require("../assets/arrow-doodle.png")}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
        }}
      />
    </View>
  );
};
