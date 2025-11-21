// app/auth/start.tsx - EXACT DESIGN SPECIFICATIONS
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Exact Brand Colors (fix definiert)
const COLORS = {
  primary: '#3D5C47',      // Brand Green
  secondary: '#F7F4EF',    // Sand / Light Beige
  accent: '#DDE7EF',       // Soft Blue
  text: '#111111',         // Text Schwarz
  gray: '#6F6F6F',         // Grau für Untertitel
  error: '#D9534F',        // Fehlerfarbe
  bgTop: '#FAF9F7',        // Hintergrund oben
  bgBottom: '#FFFFFF',     // Hintergrund unten
  logoContainer: '#F7F6F4', // Logo Container
  footerText: '#8C8C8C',   // Footer Text
  white: '#FFFFFF',
};

export default function AuthStart() {
  const router = useRouter();

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const button1Opacity = useRef(new Animated.Value(0)).current;
  const button2Opacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered fade-in animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(button1Opacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(button2Opacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Gradient - Glow Effect */}
      <LinearGradient
        colors={['#FEFDFB', '#FAF8F5', '#F8F6F3']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Decorative Circles - subtle */}
      <View style={styles.decoCircle1} />
      <View style={styles.decoCircle2} />
      <View style={styles.decoCircle3} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Spacer */}
          <View style={{ height: 100 }} />

          {/* Logo & Claim - Animated */}
          <Animated.View 
            style={[
              styles.heroContainer,
              { 
                opacity: logoOpacity,
                transform: [{ scale: logoScale }]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image
                source={{ uri: 'https://customer-assets.emergentagent.com/job_quickjobs-10/artifacts/sce5x6fk_Image.jpeg' }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.claim}>
              wenn's jetzt passieren muss.
            </Text>
          </Animated.View>

          {/* Headline - Animated */}
          <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
            <Text style={styles.headline}>
              Willkommen bei BCKP
            </Text>
          </Animated.View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Buttons - Animated */}
          <View style={styles.buttonsContainer}>
            <Animated.View style={{ width: '100%', opacity: button1Opacity }}>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Registrieren</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>

            <Animated.View style={{ width: '100%', opacity: button2Opacity }}>
              <Link href="/auth/login" asChild>
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  activeOpacity={0.9}
                >
                  <Text style={styles.secondaryButtonText}>Login</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          </View>

          {/* Spacer */}
          <View style={{ height: 40 }} />

          {/* Footer - Animated */}
          <Animated.View style={[styles.footerContainer, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>
              Mit deiner Nutzung akzeptierst du unsere
            </Text>
            <View style={styles.legalLinksRow}>
              <Pressable onPress={() => router.push('/legal/agb')}>
                <Text style={styles.legalLink}>AGB</Text>
              </Pressable>
              <Text style={styles.legalDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.legalLink}>Datenschutz</Text>
              </Pressable>
              <Text style={styles.legalDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/guidelines')}>
                <Text style={styles.legalLink}>Grundsätze</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Bottom Padding */}
          <View style={{ height: 40 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.softBeige,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  // Decorative Elements
  decoCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(47, 79, 58, 0.03)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(47, 79, 58, 0.02)',
  },
  decoCircle3: {
    position: 'absolute',
    top: '40%',
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(47, 79, 58, 0.025)',
  },

  // Hero Section
  heroContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 8,
  },
  logo: {
    width: 150,
    height: 150,
  },
  claim: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.softGray,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.3,
  },

  // Title Section
  titleContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  // Buttons Section
  buttonsContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },

  // Footer Section
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.legalText,
    textAlign: 'center',
    marginBottom: 8,
  },
  legalLinksRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legalLink: {
    fontSize: 12,
    color: COLORS.legalText,
    letterSpacing: 0.2,
  },
  legalDot: {
    fontSize: 12,
    color: COLORS.legalText,
  },
});