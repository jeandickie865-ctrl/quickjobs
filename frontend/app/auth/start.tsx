// app/auth/start.tsx - BCKP BOLD STARTUP (OPTION B)
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui/Button';

export default function AuthStart() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.slogan, { color: colors.textMuted, marginTop: spacing.md }]}>
            wenn’s jetzt passieren muss.
          </Text>
        </View>

        {/* Title & Buttons */}
        <View style={styles.buttonsContainer}>
          <Text style={[styles.title, { color: colors.text, marginBottom: spacing.xxl }]}>
            Willkommen bei BCKP
          </Text>

          <Link href="/auth/signup" asChild>
            <Button 
              title="Registrieren" 
              onPress={() => {}} 
              style={{ marginBottom: spacing.md }} 
            />
          </Link>

          <Link href="/auth/login" asChild>
            <Button 
              title="Login" 
              onPress={() => {}} 
              variant="secondary" 
            />
          </Link>

          {/* Rechtliche Links */}
          <View style={{ marginTop: spacing.xxl, alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ fontSize: 13, color: colors.gray700, textAlign: 'center', lineHeight: 19 }}>
              Mit deiner Nutzung akzeptierst du unsere AGB,{' \n'}die Datenschutzerklärung und die Grundsätze.
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable onPress={() => router.push('/legal/agb')}>
                <Text style={{ fontSize: 13, color: colors.primary, textDecorationLine: 'underline', fontWeight: '500' }}>
                  AGB
                </Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: colors.gray300 }}>•</Text>
              <Pressable onPress={() => router.push('/legal/privacy')}>
                <Text style={{ fontSize: 13, color: colors.primary, textDecorationLine: 'underline', fontWeight: '500' }}>
                  Datenschutz
                </Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: colors.gray300 }}>•</Text>
              <Pressable onPress={() => router.push('/legal/guidelines')}>
                <Text style={{ fontSize: 13, color: colors.primary, textDecorationLine: 'underline', fontWeight: '500' }}>
                  Grundsätze
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    width: 140,
    height: 140,
  },
  slogan: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});
