// app/auth/start.tsx - FANCY MINIMAL (Mint/Lila/Gold)
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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

  // Animation values
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.98)).current;
  const button1Y = useRef(new Animated.Value(20)).current;
  const button1Opacity = useRef(new Animated.Value(0)).current;
  const button2Y = useRef(new Animated.Value(20)).current;
  const button2Opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Exact animation sequence as specified
    Animated.sequence([
      // Screen Fade-In 0.5s
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Logo Mini-Scale 180ms
      Animated.timing(logoScale, {
        toValue: 1.0,
        duration: 180,
        useNativeDriver: true,
      }),
      // Text Fade-In with 0.2s Delay
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
      // Buttons Slide-Up + Fade-In
      Animated.parallel([
        Animated.timing(button1Y, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(button1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button2Y, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(button2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background Gradient - exakt wie spezifiziert */}
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgBottom]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Spacer */}
          <View style={{ height: 80 }} />

          {/* Logo Block - mit exakten Specs */}
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://customer-assets.emergentagent.com/job_quickjobs-10/artifacts/sce5x6fk_Image.jpeg' }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Claim - exakte Specs */}
          <Animated.View style={{ opacity: textOpacity }}>
            <Text style={styles.claim}>
              wenn's jetzt passieren muss.
            </Text>
          </Animated.View>

          {/* Haupttitel - exakt 48px Abstand */}
          <Animated.View style={[styles.titleContainer, { opacity: textOpacity }]}>
            <Text style={styles.title}>
              Willkommen bei BACKUP
            </Text>
          </Animated.View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Button 1 - Registrieren (Primary) - exakte Specs */}
          <Animated.View style={[
            styles.buttonWrapper,
            {
              opacity: button1Opacity,
              transform: [{ translateY: button1Y }]
            }
          ]}>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity 
                style={styles.primaryButton}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Registrieren</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Button 2 - Login (Secondary) - exakte Specs */}
          <Animated.View style={[
            styles.buttonWrapper,
            {
              opacity: button2Opacity,
              transform: [{ translateY: button2Y }]
            }
          ]}>
            <Link href="/auth/login" asChild>
              <TouchableOpacity 
                style={styles.secondaryButton}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>Login</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Footer - exakte Specs */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Mit deiner Nutzung akzeptierst du unsere
            </Text>
            <View style={styles.footerLinks}>
              <Pressable onPress={() => router.push('/legal/agb')}>
                <Text style={styles.footerLink}>AGB</Text>
              </Pressable>
              <Text style={styles.footerDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.footerLink}>Datenschutz</Text>
              </Pressable>
              <Text style={styles.footerDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/guidelines')}>
                <Text style={styles.footerLink}>Grundsätze</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom Padding - exakt 32px */}
          <View style={{ height: 32 }} />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Logo Container - exakte Specs
  logoContainer: {
    backgroundColor: COLORS.logoContainer,
    padding: 32,
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },

  // Claim - exakte Specs
  claim: {
    fontSize: 15,
    color: COLORS.gray,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 20,
  },

  // Haupttitel - exakt 48px Abstand
  titleContainer: {
    marginTop: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Buttons - exakte Specs
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '90%',
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    width: '90%',
    height: 54,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Footer - exakte Specs
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.footerText,
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
    color: COLORS.primary,
  },
  footerDot: {
    fontSize: 12,
    color: COLORS.footerText,
  },
});
