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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* LOGO MIT DUNKELLILA HINTERGRUND - VOLLE BREITE */}
        <View style={{ width: '100%', backgroundColor: '#9333EA', paddingVertical: 40, marginTop: 40, marginBottom: 30, alignItems: 'center' }}>
          <Animated.View
            style={{
              opacity: fadeLogo,
              alignItems: 'center'
            }}
          >
            <Image
              source={{ uri: 'https://customer-assets.emergentagent.com/job_129a3665-288c-42bb-9ab2-25aee1dfc3eb/artifacts/4jtdk7oz_Black%20White%20Minimal%20Simple%20Modern%20Letter%20A%20%20Arts%20Gallery%20%20Logo-12.png' }}
              style={{
                width: 200,
                height: 200,
                backgroundColor: 'transparent'
              }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <View style={{ paddingHorizontal: 24 }}>

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
              color: '#1A1A1A',
              textAlign: 'center',
              marginBottom: 6
            }}
          >
            Quickjobs. Für Jobs, die jetzt zählen.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: 'rgba(0,0,0,0.6)',
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
              backgroundColor: '#FF773D',
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
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>
              Anmelden
            </Text>
          </Pressable>

          {/* Micro-Hint */}
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(0,0,0,0.5)',
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
            <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', textDecorationLine: 'underline' }}>
              AGB
            </Text>
          </Pressable>

          <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>•</Text>

          <Pressable onPress={() => router.push('/legal/privacy')}>
            <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', textDecorationLine: 'underline' }}>
              Datenschutz
            </Text>
          </Pressable>

          <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>•</Text>

          <Pressable onPress={() => router.push('/legal/impressum')}>
            <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', textDecorationLine: 'underline' }}>
              Impressum
            </Text>
          </Pressable>
        </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
