// app/auth/signup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Bitte gültige E-Mail eingeben'),
  password: z.string().min(8, 'Passwort mindestens 8 Zeichen'),
  confirm: z.string().min(8, 'Passwort mindestens 8 Zeichen')
}).refine(v => v.password === v.confirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm']
});

export default function Signup() {
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

    // 1. Lokale Validierung
    const parsed = schema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      setError(first.message);
      console.log('Signup validation error:', first);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Signup start for:', email);

      // 2. Aufruf deines AuthContext
      await signUp(parsed.data.email, parsed.data.password);

      console.log('Signup success, redirect to /start');

      // 3. WICHTIG: Hierhin weiterleiten
      router.replace('/start');
    } catch (e: any) {
      console.log('Signup error:', e);
      setError(e?.message || 'Fehler bei der Registrierung');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.beige50, padding: spacing.md, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.black, fontSize: 22, fontWeight: '800' }}>Registrierung</Text>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>E-Mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.white,
              color: colors.black
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Passwort</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.white,
              color: colors.black
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Passwort wiederholen</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.white,
              color: colors.black
            }}
          />
        </View>

        {error && (
          <Text style={{ color: 'red', fontSize: 13 }}>
            {error}
          </Text>
        )}

        <Button
          title={isSubmitting ? 'Registriere…' : 'Registrieren'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </View>
    </View>
  );
}