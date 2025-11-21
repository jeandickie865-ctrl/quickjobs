import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'E-Mail erforderlich').email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort erforderlich'),
});

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrors({});
    
    // Validate with safeParse
    const result = loginSchema.safeParse({ 
      email: email.trim(), 
      password 
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
      await signIn(result.data.email, result.data.password);
      // Redirect happens automatically via start.tsx
      router.replace('/start');
    } catch (error: any) {
      Alert.alert('Login fehlgeschlagen', error.message || 'Ein unbekannter Fehler ist aufgetreten');
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
            Login
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
            placeholder="Dein Passwort"
            secureTextEntry
            error={errors.password}
            containerStyle={{ marginBottom: spacing.xl }}
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Zurück"
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