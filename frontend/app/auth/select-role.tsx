// app/auth/select-role.tsx
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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

export default function SelectRoleScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  const [role, setRole] = useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, []);

  const selectCard = (type) => {
    setRole(type);
  };

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
              marginBottom: 26
            }}
          />

          <Text style={{ fontSize: 18, color: COLORS.white, textAlign: 'center' }}>
            Wer bist du?
          </Text>
        </Animated.View>

        {/* ROLE CARDS */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            marginTop: 40,
            gap: 18
          }}
        >

          {/* AUFTRAGNEHMER */}
          <Pressable
            onPress={() => selectCard('auftragnehmer')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              padding: 22,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: role === 'auftragnehmer' ? COLORS.purple : 'rgba(255,255,255,0.06)'
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 6 }}>
              Ich suche Arbeit
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.muted }}>
              Finde passende Einsätze.
            </Text>
          </Pressable>

          {/* AUFTRAGGEBER */}
          <Pressable
            onPress={() => selectCard('auftraggeber')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              padding: 22,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: role === 'auftraggeber' ? COLORS.purple : 'rgba(255,255,255,0.06)'
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 6 }}>
              Ich suche kurzfristig Hilfe
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.muted }}>
              Finde schnelle Unterstützung.
            </Text>
          </Pressable>
        </Animated.View>

        {/* BUTTON */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            alignItems: 'center',
            marginTop: 40
          }}
        >
          <Pressable
            disabled={!role}
            onPress={() => router.push('/auth/onboarding/name')}
            style={{
              backgroundColor: role ? COLORS.purple : 'rgba(255,255,255,0.1)',
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>
              Weiter
            </Text>
          </Pressable>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}
