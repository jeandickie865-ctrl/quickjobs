// app/auth/start.tsx - MODERN PREMIUM MINIMAL
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Modern Premium Brand Colors
const COLORS = {
  primary: '#2F4F3A',
  primaryDark: '#254231',
  softBeige: '#FAF8F5',
  offWhite: '#FEFEFE',
  softGray: '#6A6A6A',
  text: '#111111',
  legalText: '#999999',
  white: '#FFFFFF',
};

export default function AuthStart() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top Spacer - viel Luft */}
        <View style={{ height: 80 }} />

        {/* Hero - Logo & Claim */}
        <View style={styles.heroContainer}>
          <View style={styles.logoShadow}>
            <Image
              source={{ uri: 'https://customer-assets.emergentagent.com/job_quickjobs-10/artifacts/sce5x6fk_Image.jpeg' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.claim}>
            wenn’s jetzt passieren muss.
          </Text>
        </View>

        {/* Headline */}
        <View style={{ marginTop: 32 }}>
          <Text style={styles.headline}>
            Willkommen bei BCKP
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Buttons - 90% Breite */}
        <View style={styles.buttonsContainer}>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity 
              style={styles.primaryButton}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Registrieren</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/auth/login" asChild>
            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Legal Section - ganz unten */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalDescription}>
            Mit deiner Nutzung akzeptierst du unsere AGB,{' \n'}die Datenschutzerklärung und die Grundsätze.
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
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 32 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroContainer: {
    alignItems: 'center',
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 140,
    height: 140,
  },
  claim: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  buttonsContainer: {
    alignItems: 'center',
    gap: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: '90%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: '#F7F8F7',
    width: '90%',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  legalContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  legalDescription: {
    fontSize: 10,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 8,
  },
  legalLinksRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  legalLink: {
    fontSize: 10,
    color: COLORS.legalText,
    letterSpacing: 0.2,
  },
  legalDot: {
    fontSize: 10,
    color: COLORS.legalText,
  },
});
