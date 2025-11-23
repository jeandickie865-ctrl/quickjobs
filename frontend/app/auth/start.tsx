// app/auth/start.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { resetAllStorage } from '../../utils/resetStorage';
import { migrateUserIdsToEmailBased } from '../../utils/migrateUserIds';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  whiteTransparent: 'rgba(255,255,255,0.7)',
};

export default function WelcomeScreen() {
  const router = useRouter();
  
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <LinearGradient colors={['#5941FF', '#4935CC']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* RESET Button (oben rechts) */}
          <View style={{ position: 'absolute', top: 50, right: 24, zIndex: 10 }}>
            <Pressable
              onPress={resetAllStorage}
              style={{
                backgroundColor: '#FF4444',
                padding: 12,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </Pressable>
          </View>
          
          <View style={{ height: 60 }} />
          
          <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, alignItems: 'center' }}>
            <View style={{ backgroundColor: COLORS.neon, borderRadius: 22, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }}>
              <Image source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }} style={{ width: 180, height: 180 }} resizeMode="contain" />
            </View>
          </Animated.View>

          <View style={{ height: 32 }} />

          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: COLORS.white, textAlign: 'center', marginBottom: 12 }}>Willkommen bei BACKUP</Text>
            <Text style={{ fontSize: 16, color: COLORS.whiteTransparent, textAlign: 'center', fontWeight: '500', marginBottom: 60 }}>wenn's jetzt passieren muss.</Text>

            <Pressable onPress={() => router.push('/auth/signup')} style={({ pressed }) => ({ backgroundColor: COLORS.neon, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16, opacity: pressed ? 0.9 : 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 })}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>Registrieren</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/auth/login')} style={({ pressed }) => ({ backgroundColor: COLORS.white, paddingVertical: 18, borderRadius: 16, borderWidth: 2, borderColor: COLORS.neon, alignItems: 'center', opacity: pressed ? 0.9 : 1 })}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.neon }}>Anmelden</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
