// app/auth/start.tsx - OFFIZIELLER BCKP DESIGN SYSTEM
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// BCKP Design System Colors
const COLORS = {
  primary: '#345C45',
  primaryDark: '#2D4F3B',
  primaryLight: '#DDE5E0',
  surface: '#F7F8F7',
  text: '#0E0E0E',
  textSecondary: '#5E615F',
  border: 'rgba(52,92,69,0.45)',
  white: '#FFFFFF',
};

export default function AuthStart() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background mit Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.03)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Spacer */}
          <View style={{ flex: 0.8 }} />

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoShadow}>
              <Image
                source={require('../../assets/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.slogan}>
              wenn's jetzt passieren muss.
            </Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Title & Buttons */}
          <View style={styles.buttonsContainer}>
            <Text style={styles.title}>
              Willkommen{'\n'}bei BCKP
            </Text>

            {/* Primary Button - Registrieren */}
            <Link href="/auth/signup" asChild>
              <TouchableOpacity 
                style={styles.primaryButton}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Registrieren</Text>
              </TouchableOpacity>
            </Link>

            {/* Secondary Button - Login */}
            <Link href="/auth/login" asChild>
              <TouchableOpacity 
                style={styles.secondaryButton}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Bottom Spacer */}
          <View style={{ flex: 0.6 }} />

          {/* Rechtliche Links */}
          <View style={styles.legalContainer}>
            <View style={styles.legalRow}>
              <Pressable onPress={() => router.push('/legal/agb')}>
                <Text style={styles.legalText}>AGB</Text>
              </Pressable>
              <Text style={styles.legalDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.legalText}>Datenschutz</Text>
              </Pressable>
              <Text style={styles.legalDot}>•</Text>
              <Pressable onPress={() => router.push('/legal/guidelines')}>
                <Text style={styles.legalText}>Grundsätze</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 24 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  logo: {
    width: 140,
    height: 140,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  buttonsContainer: {
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: 'rgba(52,92,69,0.05)',
    height: 54,
    borderRadius: 14,
    borderWidth: 0.75,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  legalContainer: {
    alignItems: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  legalDot: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});