// app/auth/login.tsx - BCKP Style
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
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.black, marginBottom: spacing.lg, textAlign: 'center' }}>
              Willkommen zurück
            </Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={{
                backgroundColor: colors.errorLight,
                padding: spacing.md,
                borderRadius: 10,
                marginBottom: spacing.md,
              }}>
                <Text style={{ color: colors.error, fontWeight: '500', fontSize: 14 }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ fontWeight: '500', color: colors.gray900, marginBottom: 6, fontSize: 14 }}>
                E-Mail
              </Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@email.de"
                placeholderTextColor={colors.gray500}
                value={email}
                onChangeText={setEmail}
                style={{
                  borderWidth: 1,
                  borderColor: colors.gray300,
                  borderRadius: 10,
                  padding: 14,
                  backgroundColor: colors.white,
                  color: colors.black,
                  fontSize: 15,
                }}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontWeight: '500', color: colors.gray900, marginBottom: 6, fontSize: 14 }}>
                Passwort
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.gray300,
                borderRadius: 10,
                backgroundColor: colors.white,
              }}>
                <TextInput
                  placeholder="••••••"
                  placeholderTextColor={colors.gray500}
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  style={{
                    flex: 1,
                    padding: 14,
                    color: colors.black,
                    fontSize: 15,
                  }}
                />
                <Pressable onPress={() => setShowPw(!showPw)} style={{ padding: 12 }}>
                  {showPw ? (
                    <EyeOff size={20} color={colors.gray500} />
                  ) : (
                    <Eye size={20} color={colors.gray500} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Passwort vergessen Link */}
            <Pressable 
              onPress={() => router.push('/auth/forgot-password')}
              style={{ marginBottom: spacing.lg, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' }}>
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
            <Button
              title="Registrieren?"
              variant="ghost"
              onPress={() => router.push('/auth/signup')}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
