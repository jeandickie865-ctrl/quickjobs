// app/auth/start.tsx - VIVID BLUE-PURPLE & NEON LIME
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FancyButton from '../../components/FancyButton';

// VIVID BLUE-PURPLE & NEON LIME Colors
const COLORS = {
  vividPurple: '#5941FF',
  neonLime: '#C8FF16',
  black: '#000000',
  white: '#FFFFFF',
  whiteFooter: 'rgba(255,255,255,0.6)',
};

export default function AuthStart() {
  const router = useRouter();

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Vivid Purple Background */}
      <View style={styles.purpleBackground} />

      {/* Neon Lime Bubble (optional) */}
      <View style={styles.limeBubble} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Spacer - erhöht um 25px */}
          <View style={{ height: 105 }} />

          {/* Logo auf Neon-Lime Quadrat mit Purple Glow - optimiert */}
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <View style={styles.logoGlowContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>

          {/* Slogan mit Neon-Lime Bullet */}
          <Animated.View style={[styles.sloganContainer, { opacity: contentOpacity }]}>
            <View style={styles.limeBullet} />
            <Text style={styles.slogan}>
              wenn’s jetzt passieren muss.
            </Text>
          </Animated.View>

          {/* Headline - Weiß, 900, zentriert */}
          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.headline}>
              Willkommen bei BACKUP
            </Text>
          </Animated.View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Buttons - Expo Web Safe */}
          <Animated.View style={[styles.buttonsContainer, { opacity: contentOpacity }]}>
            <FancyButton
              title="Registrieren"
              type="primary"
              colors={{ 
                primary: COLORS.neonLime, 
                primaryDark: '#B3E612' 
              }}
              onPress={() => router.push('/auth/signup')}
            />

            <View style={{ height: 16 }} />

            <Pressable
              onPress={() => router.push('/auth/login')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Mit deiner Nutzung akzeptierst du unsere
            </Text>
            <View style={styles.footerLinks}>
              <Pressable onPress={() => router.push('/legal/agb')}>
                <Text style={styles.footerLink}>AGB</Text>
              </Pressable>
              <Text style={styles.limeDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.footerLink}>Datenschutz</Text>
              </Pressable>
              <Text style={styles.limeDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/guidelines')}>
                <Text style={styles.footerLink}>Grundsätze</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purpleBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.vividPurple,
  },
  limeBubble: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.neonLime,
    opacity: 0.18,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Logo mit Purple Glow
  logoGlowContainer: {
    shadowColor: COLORS.vividPurple,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoContainer: {
    width: 220,
    height: 220,
    backgroundColor: COLORS.neonLime,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 180,
  },

  // Slogan mit Neon-Lime Bullet
  sloganContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  limeBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neonLime,
  },
  slogan: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.black,
    letterSpacing: 0.5,
  },

  // Headline - Weiß, 900
  headline: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 32,
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.neonLime,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.neonLime,
  },

  // Footer
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.whiteFooter,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 11,
    color: COLORS.whiteFooter,
  },
  limeDot: {
    fontSize: 11,
    color: COLORS.neonLime,
  },
});
