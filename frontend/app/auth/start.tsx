// app/auth/start.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  // Animations
  const fadeLogo = useRef(new Animated.Value(0)).current;
  const fadeLine = useRef(new Animated.Value(0)).current;
  const fadePanel = useRef(new Animated.Value(0)).current;
  const slideButtons = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeLogo, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(fadeLine, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(fadePanel, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(slideButtons, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0E0B1F', '#141126']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* LOGO-BLOCK */}
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            marginTop: 100,  // iPhone Notch Abstand
            marginBottom: 26
          }}
        >
          <Image
            source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
            style={{
              width: 160,
              height: 160,
              tintColor: '#6B4BFF'
            }}
            resizeMode="contain"
          />

          {/* Neon-Linie */}
          <View
            style={{
              width: 55,
              height: 3,
              backgroundColor: '#C8FF16',
              borderRadius: 2,
              marginTop: 14,
              opacity: 0.9
            }}
          />
        </View>

        {/* GLAS-PANEL (SLOGAN) */}
        <View
          style={{
            width: '100%',
            padding: 24,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 6,
              lineHeight: 32
            }}
          >
            BACKUP. Für Jobs, die jetzt zählen.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              lineHeight: 20
            }}
          >
            Starte ohne Umwege in deine nächste Schicht.
          </Text>
        </View>

        {/* BUTTONS */}
        <View style={{ width: '100%', alignItems: 'center' }}>

          <Pressable
            onPress={() => router.push('/auth/signup')}
            style={{
              backgroundColor: '#6B4BFF',
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              marginBottom: 14
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
              Registrieren
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/auth/login')}
            style={{
              backgroundColor: '#7C5CFF',
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              marginBottom: 24
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
              Anmelden
            </Text>
          </Pressable>

          {/* Micro-Hint unter den Buttons – iPhone UX Standard */}
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 30
            }}
          >
            Deine Anmeldung dauert unter 30 Sekunden.
          </Text>
        </View>

        {/* FOOTER */}
        <View
          style={{
            marginBottom: 30,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12
          }}
        >
          <Pressable onPress={() => router.push('/legal/agb')}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' }}>
              AGB
            </Text>
          </Pressable>

          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>•</Text>

          <Pressable onPress={() => router.push('/legal/privacy')}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' }}>
              Datenschutz
            </Text>
          </Pressable>

          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>•</Text>

          <Pressable onPress={() => router.push('/legal/impressum')}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' }}>
              Impressum
            </Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}
