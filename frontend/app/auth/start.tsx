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
      colors={['#00A07C', '#00A07C']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* LOGO */}
        <Animated.View
          style={{
            opacity: fadeLogo,
            alignItems: 'center',
            marginTop: 100,
            marginBottom: 20
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
        </Animated.View>

        {/* NEON LINE */}
        <Animated.View
          style={{
            opacity: fadeLine,
            alignItems: 'center',
            marginBottom: 26
          }}
        >
          <View
            style={{
              width: 55,
              height: 3,
              backgroundColor: '#EFABFF',
              borderRadius: 2
            }}
          />
        </Animated.View>

        {/* GLASS PANEL */}
        <Animated.View
          style={{
            opacity: fadePanel,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.07)',
            borderWidth: 1,
            padding: 24,
            borderRadius: 22,
            marginBottom: 32
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 6
            }}
          >
            BACKUP. Für Jobs, die jetzt zählen.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center'
            }}
          >
            Starte ohne Umwege in deine nächste Schicht.
          </Text>
        </Animated.View>

        {/* BUTTONS */}
        <Animated.View
          style={{
            transform: [{ translateY: slideButtons }],
            alignItems: 'center',
            width: '100%'
          }}
        >
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
              backgroundColor: '#EFABFF',
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
              Anmelden
            </Text>
          </Pressable>

          {/* Micro-Hint */}
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 22
            }}
          >
            Deine Anmeldung dauert 30 Sekunden.
          </Text>
        </Animated.View>

        {/* FOOTER */}
        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 26
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
    </LinearGradient>
  );
}
