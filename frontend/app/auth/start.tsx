import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui/Button';

export default function AuthStart() {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.slogan, { color: colors.gray700, marginTop: spacing.sm }]}>
            wenn's jetzt passieren muss
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Text style={[styles.title, { color: colors.black, marginBottom: spacing.xl }]}>
            Willkommen bei BCKP
          </Text>

          <Link href="/auth/signup" asChild>
            <Button title="Registrieren" onPress={() => {}} style={{ marginBottom: spacing.md }} />
          </Link>

          <Link href="/auth/login" asChild>
            <Button title="Login" onPress={() => {}} variant="secondary" />
          </Link>
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
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});