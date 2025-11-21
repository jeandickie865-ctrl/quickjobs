import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Eye, EyeOff } from '../../components/Icons';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, spacing } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin() {
    setErrorMsg('');
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/start');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.white,
        padding: spacing.lg,
        justifyContent: 'center',
      }}
    >

      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: colors.black }}>
          Willkommen zurück
        </Text>
        <Text style={{ marginTop: 6, color: colors.gray600, fontSize: 15 }}>
          Logge dich mit deiner E-Mail und deinem Passwort ein.
        </Text>
      </View>

      {/* Error Message */}
      {errorMsg ? (
        <View
          style={{
            backgroundColor: colors.errorLight,
            padding: spacing.sm,
            borderRadius: 8,
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ color: colors.error, fontWeight: '600' }}>
            {errorMsg}
          </Text>
        </View>
      ) : null}

      {/* Email Input */}
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ fontWeight: '600', color: colors.black, marginBottom: 6 }}>
          E-Mail
        </Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="name@email.de"
          placeholderTextColor={colors.gray400}
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: colors.gray300,
            borderRadius: 10,
            padding: 14,
            backgroundColor: colors.beige100,
            color: colors.black,
          }}
        />
      </View>

      {/* Password Input */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ fontWeight: '600', color: colors.black, marginBottom: 6 }}>
          Passwort
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.gray300,
            borderRadius: 10,
            backgroundColor: colors.beige100,
          }}
        >
          <TextInput
            placeholder="******"
            placeholderTextColor={colors.gray400}
            secureTextEntry={!showPw}
            value={password}
            onChangeText={setPassword}
            style={{
              flex: 1,
              padding: 14,
              color: colors.black,
            }}
          />

          <Pressable onPress={() => setShowPw(!showPw)} style={{ padding: 12 }}>
            {showPw ? (
              <EyeOff size={20} color={colors.gray600} />
            ) : (
              <Eye size={20} color={colors.gray600} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Login Button */}
      <Button
        title={loading ? 'Lädt…' : 'Einloggen'}
        onPress={handleLogin}
        disabled={loading}
      />

      {/* Link zu Signup */}
      <Pressable
        onPress={() => router.push('/auth/signup')}
        style={{ marginTop: spacing.lg }}
      >
        <Text style={{ color: colors.black, textAlign: 'center', fontSize: 15 }}>
          Noch keinen Account?{' '}
          <Text style={{ fontWeight: '700', color: colors.primary }}>
            Registrieren
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}