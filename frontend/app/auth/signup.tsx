// app/auth/signup.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bgDark: '#0E0B1F',
  bgCard: '#141126',
  purple: '#6B4BFF',
  purpleLight: '#7C5CFF',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  neon: '#C8FF16'
};

export default function SignupScreen() {
  const router = useRouter();

  // Animations
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <LinearGradient colors={[COLORS.bgDark, COLORS.bgCard]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* HEADER */}
        <Animated.View
          style={{
            opacity: fade,
            marginTop: 60,
            alignItems: 'center'
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.white, marginBottom: 8 }}>
            BACKUP
          </Text>

          <View
            style={{
              width: 55,
              height: 3,
              backgroundColor: COLORS.neon,
              borderRadius: 2,
              marginBottom: 24
            }}
          />

          <Text style={{ fontSize: 16, color: COLORS.muted, textAlign: 'center' }}>
            Erstelle deinen Account.
          </Text>
        </Animated.View>


        {/* FORM PANEL */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.07)',
            borderWidth: 1,
            padding: 22,
            borderRadius: 20,
            marginTop: 40
          }}
        >
          {/* EMAIL */}
          <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>
            E-Mail
          </Text>
          <TextInput
            placeholder="name@email.de"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: COLORS.bgCard,
              padding: 14,
              borderRadius: 12,
              color: COLORS.white,
              marginBottom: 18
            }}
          />

          {/* PASSWORD */}
          <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>
            Passwort
          </Text>
          <TextInput
            placeholder="Mindestens 6 Zeichen"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            style={{
              backgroundColor: COLORS.bgCard,
              padding: 14,
              borderRadius: 12,
              color: COLORS.white,
              marginBottom: 18
            }}
          />

          {/* CONFIRM */}
          <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>
            Passwort wiederholen
          </Text>
          <TextInput
            placeholder="Passwort wiederholen"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            style={{
              backgroundColor: COLORS.bgCard,
              padding: 14,
              borderRadius: 12,
              color: COLORS.white,
              marginBottom: 10
            }}
          />
        </Animated.View>


        {/* BUTTON */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            alignItems: 'center',
            marginTop: 24
          }}
        >
          <Pressable
            onPress={() => router.push('/auth/select-role')}
            style={{
              backgroundColor: COLORS.purple,
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              marginBottom: 14
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>
              Weiter
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={{ fontSize: 14, color: COLORS.muted }}>
              Schon einen Account?{' '}
              <Text style={{ color: COLORS.white, textDecorationLine: 'underline' }}>Login</Text>
            </Text>
          </Pressable>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}
