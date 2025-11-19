import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export default function SignupScreen() {
  const { colors, spacing } = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setErrors({});
    
    // Validate
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      // Redirect happens automatically via start.tsx
      router.replace('/onboarding/role');
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
          <Text style={[styles.title, { color: colors.black, marginBottom: spacing.xl }]}>
            Registrieren
          </Text>

          <Input
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.de"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 8 Zeichen"
            secureTextEntry
            error={errors.password}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Passwort wiederholen"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Passwort bestätigen"
            secureTextEntry
            error={errors.confirmPassword}
            containerStyle={{ marginBottom: spacing.xl }}
          />

          <Button
            title="Registrieren"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Zurück zum Login"
            onPress={() => router.back()}
            variant="ghost"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
});