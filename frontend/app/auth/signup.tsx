import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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

    // Validate with safeParse
    const result = signupSchema.safeParse({ 
      email: email.trim(), 
      password, 
      confirm 
    });
    
    if (!result.success) {
      // Use correct Zod v3+ API: result.error.issues
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
      Alert.alert('Registrierung fehlgeschlagen', error.message || 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  }

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
            autoCorrect={false}
            error={errors.email}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 6 Zeichen"
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Passwort bestätigen"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Passwort wiederholen"
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirm}
            containerStyle={{ marginBottom: spacing.xl }}
          />

          <Button
            title="Registrieren"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Ich habe schon einen Account"
            onPress={() => router.replace('/auth/login')}
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
