// components/FancyButton.tsx - Updated for Neon Lime
import React, { useState } from "react";
import { Pressable, Text, ViewStyle, TextStyle } from "react-native";

interface FancyButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary";
  colors: {
    primary: string;
    primaryDark: string;
  };
}

export default function FancyButton({
  title,
  onPress,
  type = "primary",
  colors,
}: FancyButtonProps) {
  const [pressed, setPressed] = useState(false);

  const baseStyle: ViewStyle = {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  };

  const primaryStyle: ViewStyle = {
    backgroundColor: pressed ? colors.primaryDark : colors.primary,
    shadowColor: '#5941FF',
    shadowOpacity: pressed ? 0.15 : 0.18,
    shadowRadius: pressed ? 8 : 12,
    shadowOffset: { width: 0, height: 4 },
  };

  const secondaryStyle: ViewStyle = {
    backgroundColor: pressed ? "#F2F2F2" : "white",
    borderWidth: 2,
    borderColor: colors.primary,
  };

  const textStyle: TextStyle = {
    fontSize: 17,
    fontWeight: "700",
    color: type === "primary" ? "#000000" : colors.primary,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={() => {
        if (type === "primary") {
          return { ...baseStyle, ...primaryStyle };
        }
        return { ...baseStyle, ...secondaryStyle };
      }}
    >
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}
