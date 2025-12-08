// app/auth/onboarding/location.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bgDark: '#00A07C',
  bgCard: '#00A07C',
  purple: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#00A07C",
  muted: 'rgba(0,0,0,0.6)',
  neon: '#EFABFF'
};

export default function OnboardingLocation() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 450, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <LinearGradient colors={[COLORS.bgDark, COLORS.bgCard]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* HEADER */}
        <Animated.View style={{ opacity: fade, marginTop: 60, alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.white }}>BACKUP</Text>
          <View style={{ width: 55, height: 3, backgroundColor: COLORS.neon, marginTop: 8, borderRadius: 2 }} />
          <Text style={{ fontSize: 18, color: COLORS.white, marginTop: 26 }}>Wo wohnst du?</Text>
        </Animated.View>

        {/* CONTENT */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            marginTop: 40,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.07)',
            borderWidth: 1,
            padding: 22,
            borderRadius: 20
          }}
        >
          <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Stadt</Text>
          <TextInput
            placeholder="z.B. Berlin"
            placeholderTextColor="rgba(255,255,255,0.60)"
            style={{
              backgroundColor: COLORS.bgCard,
              padding: 14,
              borderRadius: 12,
              color: COLORS.white
            }}
          />
        </Animated.View>

        {/* BUTTON */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], alignItems: 'center', marginTop: 28 }}>
          <Pressable
            onPress={() => router.push('/auth/onboarding/phone')}
            style={{
              backgroundColor: COLORS.purple,
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>Weiter</Text>
          </Pressable>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}
