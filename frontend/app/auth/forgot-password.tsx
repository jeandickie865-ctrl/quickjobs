// app/auth/forgot-password.tsx - Green Modern Minimal
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ForgotPasswordScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert('Fehler', 'Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    // TODO: Backend-Integration für Passwort-Reset
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      Alert.alert(
        'E-Mail versendet',
        'Bitte prüfe dein Postfach. Wir haben dir einen Link zum Zurücksetzen des Passworts geschickt.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, justifyContent: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.black, marginBottom: spacing.md }}>
          Passwort zurücksetzen
        </Text>
        <Text style={{ fontSize: 15, color: colors.gray600, marginBottom: spacing.xl }}>
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
        </Text>

        <Input
          label="E-Mail"
          value={email}
          onChangeText={setEmail}
          placeholder="deine@email.de"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title={loading ? 'Wird gesendet...' : 'Link senden'}
          onPress={handleSendLink}
          loading={loading}
          disabled={loading || success}
          style={{ marginTop: spacing.md }}
        />

        <Button
          title="Zurück zum Login"
          onPress={() => router.back()}
          variant="ghost"
          style={{ marginTop: spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}
