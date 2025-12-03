// app/auth/start.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  purple: '#6B4BFF',
  purpleLight: '#7C5CFF',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)'
};

export default function WelcomeScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const glowSize = 200;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24 }}>

        {/* Extra Ambient Light */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -150,
            width: 850,
            height: 850,
            borderRadius: 425,
            backgroundColor: 'rgba(107,75,255,0.10)',
            opacity: fade,
            shadowColor: '#6B4BFF',
            shadowOpacity: 0.15,
            shadowRadius: 120
          }}
        />

        {/* Soft Halo Glow */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            width: 700,
            height: 700,
            borderRadius: 350,
            backgroundColor: 'rgba(107,75,255,0.18)',
            opacity: fade,
            shadowColor: '#6B4BFF',
            shadowOpacity: 0.25,
            shadowRadius: 80,
            transform: [{ scale }]
          }}
        />

        {/* Neon Halo unter dem Logo */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 210, // leicht unterhalb des Logos
            width: 140,
            height: 28,
            backgroundColor: 'rgba(200,255,22,0.22)', // weich und nicht grell
            borderRadius: 50,
            opacity: fade,
            shadowColor: '#C8FF16',
            shadowOpacity: 0.4,
            shadowRadius: 20,
            transform: [{ scale }]
          }}
        />

        {/* Logo mit Purple Tint + sehr leichter Neon-Kante */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ scale }],
            marginTop: 120,
            marginBottom: 40,
          }}
        >
          <Image
            source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
            style={{
              width: 150,
              height: 150,
              tintColor: '#6B4BFF',
              shadowColor: '#C8FF16',   // Neon-Kante
              shadowOpacity: 0.20,      // sehr leicht
              shadowRadius: 14           // weich und modern
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Glass Panel */}
        <Animated.View style={{ width: '100%', opacity: fade }}>
          <BlurView
            intensity={28}
            tint="dark"
            style={{
              padding: 24,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              marginBottom: 40
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.white, textAlign: 'center' }}>
              BACKUP. Für Jobs, die jetzt zählen.
            </Text>

            <Text style={{ fontSize: 16, color: COLORS.muted, textAlign: 'center', marginTop: 10 }}>
              Starte ohne Umwege in deine nächste Schicht.
            </Text>
          </BlurView>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={{ width: '100%', alignItems: 'center', opacity: fade }}>

          <Pressable
            onPress={() => router.push('/auth/signup')}
            style={{
              backgroundColor: COLORS.purple,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              marginBottom: 16
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>Registrieren</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/auth/login')}
            style={{
              backgroundColor: COLORS.purpleLight,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>Anmelden</Text>
          </Pressable>

        </Animated.View>

        {/* Legal */}
        <View style={{ marginTop: 40, flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => router.push('/legal/agb')}>
            <Text style={{ fontSize: 13, color: COLORS.muted, textDecorationLine: 'underline' }}>AGB</Text>
          </Pressable>
          <Text style={{ fontSize: 13, color: COLORS.muted }}>•</Text>
          <Pressable onPress={() => router.push('/legal/privacy')}>
            <Text style={{ fontSize: 13, color: COLORS.muted, textDecorationLine: 'underline' }}>Datenschutz</Text>
          </Pressable>
          <Text style={{ fontSize: 13, color: COLORS.muted }}>•</Text>
          <Pressable onPress={() => router.push('/legal/impressum')}>
            <Text style={{ fontSize: 13, color: COLORS.muted, textDecorationLine: 'underline' }}>Impressum</Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}
