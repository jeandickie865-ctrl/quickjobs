// app/auth/signup.tsx - BCKP Style
import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { z } from 'zod';

const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'E-Mail erforderlich')
      .email('Ungültige E-Mail-Adresse'),
    password: z
      .string()
      .min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    confirm: z
      .string()
      .min(1, 'Passwort-Bestätigung erforderlich'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirm'],
  });

export default function SignupScreen() {
  const { colors, spacing } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setErrors({});

    const result = signupSchema.safeParse({ 
      email: email.trim(), 
      password, 
      confirm 
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await signUp(result.data.email, result.data.password);
      router.replace('/start');
    } catch (error: any) {
      setErrors({ email: error.message || 'Registrierung fehlgeschlagen' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.black, marginBottom: spacing.xl }}>
            Registrieren
          </Text>

          <Input
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.de"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 6 Zeichen"
            showPasswordToggle
            error={errors.password}
          />

          <Input
            label="Passwort bestätigen"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Passwort wiederholen"
            showPasswordToggle
            error={errors.confirm}
          />

          <Button
            title={loading ? 'Wird registriert...' : 'Registrieren'}
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={{ marginTop: spacing.md }}
          />

          <Button
            title="Ich habe schon einen Account"
            variant="ghost"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
