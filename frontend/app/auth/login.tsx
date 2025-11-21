// app/auth/login.tsx - Überarbeitet mit Passwort vergessen Link
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryUltraLight }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            padding: spacing.lg 
          }}
        >
          <Card padding={spacing.xl} style={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: spacing.sm, textAlign: 'center' }}>
              Login
            </Text>
            <Text style={{ fontSize: 15, color: colors.gray600, marginBottom: spacing.xl, textAlign: 'center' }}>
              Melde dich mit deinem Account an
            </Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={{
                backgroundColor: colors.errorLight,
                padding: spacing.md,
                borderRadius: 12,
                marginBottom: spacing.md,
              }}>
                <Text style={{ color: colors.error, fontWeight: '600', fontSize: 14 }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ fontWeight: '600', color: colors.black, marginBottom: 6, fontSize: 14 }}>
                E-Mail
              </Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@email.de"
                placeholderTextColor={colors.gray600}
                value={email}
                onChangeText={setEmail}
                style={{
                  borderWidth: 2,
                  borderColor: colors.gray300,
                  borderRadius: 14,
                  padding: 14,
                  backgroundColor: colors.white,
                  color: colors.black,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontWeight: '600', color: colors.black, marginBottom: 6, fontSize: 14 }}>
                Passwort
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: colors.gray300,
                borderRadius: 14,
                backgroundColor: colors.white,
              }}>
                <TextInput
                  placeholder="••••••"
                  placeholderTextColor={colors.gray600}
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  style={{
                    flex: 1,
                    padding: 14,
                    color: colors.black,
                    fontSize: 16,
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

            {/* Passwort vergessen Link */}
            <Pressable 
              onPress={() => router.push('/auth/forgot-password')}
              style={{ marginBottom: spacing.xl, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                Passwort vergessen?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Button
              title={loading ? 'Lädt...' : 'Einloggen'}
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              style={{ marginBottom: spacing.md }}
            />

            {/* Link zu Signup */}
            <Pressable
              onPress={() => router.push('/auth/signup')}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ color: colors.gray600, fontSize: 14 }}>
                Noch kein Account?{' '}
                <Text style={{ fontWeight: '700', color: colors.primary }}>
                  Registrieren
                </Text>
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
