// components/FancyButton.tsx - Expo Web Safe (kein indexed style Fehler)
import React, { useState } from "react";
import { Pressable, Text } from "react-native";

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

  const baseStyle = {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const primaryStyle = {
    backgroundColor: pressed ? colors.primaryDark : colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: pressed ? 0.15 : 0.28,
    shadowRadius: pressed ? 6 : 12,
    shadowOffset: { width: 0, height: 5 },
  };

  const secondaryStyle = {
    backgroundColor: pressed ? "#F2F2F2" : "white",
    borderWidth: 2,
    borderColor: colors.primary,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={() => {
        // Kein Array, kein Spread mit computed properties → kein Web-Fehler
        if (type === "primary") {
          return { ...baseStyle, ...primaryStyle };
        }
        return { ...baseStyle, ...secondaryStyle };
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: type === "primary" ? "white" : colors.primary,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
