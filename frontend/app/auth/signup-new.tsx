import { z } from 'zod';
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Bitte eine E-Mail-Adresse eingeben.')
      .email('Bitte eine gültige E-Mail-Adresse eingeben.'),
    password: z
      .string()
      .min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein.'),
    confirm: z.string().min(1, 'Bitte das Passwort bestätigen.'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Die Passwörter stimmen nicht überein.',
    path: ['confirm'],
  });

export default function SignupScreen() {
  const { colors, spacing } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    const result = signupSchema.safeParse({ email, password, confirm });

    if (!result.success) {
      // Robust: Zod v3/v4 compatibility
      // Try both 'issues' (v4) and 'errors' (v3)
      const issues = (result.error as any).issues || (result.error as any).errors || [];
      
      const firstIssue = issues.length > 0 ? issues[0] : null;
      const message = firstIssue?.message ?? 'Bitte Eingaben überprüfen.';

      setError(message);
      console.log('Signup validation error:', result.error);
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp(result.data.email, result.data.password);
      router.replace('/start');
    } catch (e: any) {
      console.log('Signup error:', e);
      setError(
        e?.message ??
          'Registrierung fehlgeschlagen. Bitte später erneut versuchen.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.beige50 }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: spacing.lg,
        justifyContent: 'center',
        gap: spacing.md,
      }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.black }}>
          Registrieren
        </Text>
        <Text style={{ color: colors.gray700 }}>
          Erstelle deinen Account für kurzfristige Jobs.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>E-Mail</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="deine@email.de"
          placeholderTextColor={colors.gray400}
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.gray200,
            color: colors.black,
            fontSize: 16,
          }}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>Passwort</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Mindestens 6 Zeichen"
          placeholderTextColor={colors.gray400}
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.gray200,
            color: colors.black,
            fontSize: 16,
          }}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>
          Passwort bestätigen
        </Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Passwort wiederholen"
          placeholderTextColor={colors.gray400}
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.gray200,
            color: colors.black,
            fontSize: 16,
          }}
        />
      </View>

      {error && (
        <View style={{
          padding: spacing.sm,
          backgroundColor: '#fee',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#f88',
        }}>
          <Text style={{ color: '#c00', fontSize: 13 }}>
            {error}
          </Text>
        </View>
      )}

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <Button
          title={isSubmitting ? 'Registriere…' : 'Registrieren'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
        <Button
          title="Ich habe schon einen Account"
          variant="secondary"
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    </ScrollView>
  );
}
