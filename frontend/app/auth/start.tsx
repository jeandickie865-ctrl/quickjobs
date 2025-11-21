// app/auth/start.tsx - FANCY MINIMAL (Mint/Lila/Gold) - Expo Web Safe
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FancyButton from '../../components/FancyButton';

// BCKP Fancy Minimal Colors
const COLORS = {
  mint: '#72BC81',         // Primary Mint
  mintPressed: '#5CA870',  // Pressed Mint
  mintOutline: '#4F9E63',  // Outlined Mint (darker)
  gold: '#B2892D',         // BCKP-Gold (Slogan)
  purple: '#C576FF',       // Purple Accent (dezent)
  offWhite: '#FAFAF8',     // Hintergrund
  white: '#FFFFFF',        // Logo Card
  black: '#000000',        // Haupttitel
  footerGray: '#C1C1C1',   // Footer Links
};

export default function AuthStart() {
  const router = useRouter();
  const [primaryPressed, setPrimaryPressed] = React.useState(false);
  const [secondaryPressed, setSecondaryPressed] = React.useState(false);

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background mit radialem Mint-Glow */}
      <View style={styles.background}>
        <View style={styles.mintGlow} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Spacer */}
          <View style={{ height: 60 }} />

          {/* Logo - NEUES DESIGN */}
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Slogan mit Purple Accent */}
          <Animated.View style={[styles.sloganContainer, { opacity: contentOpacity }]}>
            <View style={styles.purpleDot} />
            <Text style={styles.slogan}>
              wenn’s jetzt passieren muss.
            </Text>
          </Animated.View>

          {/* Haupttitel */}
          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.title}>
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
              colors={{ primary: COLORS.mint, primaryDark: COLORS.mintPressed }}
              onPress={() => router.push('/auth/signup')}
            />

            <FancyButton
              title="Login"
              type="secondary"
              colors={{ primary: COLORS.mint, primaryDark: COLORS.mintPressed }}
              onPress={() => router.push('/auth/login')}
            />
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
              <Text style={styles.goldDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.footerLink}>Datenschutz</Text>
              </Pressable>
              <Text style={styles.goldDot}>•</Text>
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
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.offWhite,
  },
  mintGlow: {
    position: 'absolute',
    top: 200,
    left: 45,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.mint,
    opacity: 0.05,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Logo Container - EXAKT NACH SPEZIFIKATION
  logoContainer: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowRadius: 14,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: 220,
    height: 220,
  },
  // Slogan - 12px Abstand zum Logo
  sloganContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  purpleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.purple,
  },
  slogan: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gold,
    letterSpacing: 0.4,
  },

  // Titel - 42px Abstand zum Slogan
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
    marginTop: 42,
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
    gap: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.mint,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.mint,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.mintPressed,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    borderColor: COLORS.mintOutline,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.mint,
  },
  secondaryButtonTextPressed: {
    color: COLORS.mintOutline,
  },

  // Footer
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.footerGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.footerGray,
  },
  goldDot: {
    fontSize: 12,
    color: COLORS.gold,
  },
});
