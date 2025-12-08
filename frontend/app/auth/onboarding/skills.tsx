// app/auth/onboarding/skills.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bgDark: '#F7F7F9',
  bgCard: '#F7F7F9',
  purple: '#6A3FFF',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  neon: '#6A3FFF'
};

export default function OnboardingSkills() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  const [skills, setSkills] = useState([]);

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 450, useNativeDriver: true })
    ]).start();
  }, []);

  const skillOptions = [
    "Security",
    "Eventhilfe",
    "Ordnungsdienst",
    "Rezeption",
    "Bewachung",
    "Fahrer"
  ];

  return (
    <LinearGradient colors={[COLORS.bgDark, COLORS.bgCard]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* HEADER */}
        <Animated.View style={{ opacity: fade, marginTop: 60, alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.white }}>BACKUP</Text>
          <View style={{ width: 55, height: 3, backgroundColor: COLORS.neon, marginTop: 8, borderRadius: 2 }} />
          <Text style={{ fontSize: 18, color: COLORS.white, marginTop: 26 }}>Was kannst du?</Text>
        </Animated.View>

        {/* CONTENT */}
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            marginTop: 40,
            gap: 16
          }}
        >
          {skillOptions.map((skill) => (
            <Pressable
              key={skill}
              onPress={() => toggleSkill(skill)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                padding: 20,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: skills.includes(skill)
                  ? COLORS.purple
                  : 'rgba(255,255,255,0.07)'
              }}
            >
              <Text style={{ fontSize: 17, color: COLORS.white }}>
                {skill}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* BUTTON */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], alignItems: 'center', marginTop: 32 }}>
          <Pressable
            onPress={() => router.push('/auth/onboarding/done')}
            style={{
              backgroundColor: skills.length > 0 ? COLORS.purple : 'rgba(0,0,0,0.08)',
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300
            }}
            disabled={skills.length === 0}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>Weiter</Text>
          </Pressable>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}
