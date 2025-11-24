// app/auth/login.tsx - VIVID BLUE-PURPLE & NEON LIME
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';

// VIVID BLUE-PURPLE & NEON LIME Colors
const COLORS = {
  primary: '#5941FF',
  accent: '#C8FF16',
  accentDark: '#B3E612',
  background: '#F8F8F8',
  text: '#111111',
  textSecondary: '#666666',
  border: '#D0D0D0',
  placeholder: '#999999',
  white: '#FFFFFF',
  errorBg: '#FBECEC',
  errorBorder: '#E34242',
  errorText: '#A62828',
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Spacer */}
          <View style={{ height: 60 }} />

          {/* Headline */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.text }}>
              Login
            </Text>
          </View>

          {/* Subtitle */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.textSecondary }}>
              Schön, dass du wieder da bist.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={{
              backgroundColor: COLORS.errorBg,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.errorBorder,
              padding: 14,
              borderRadius: 8,
              marginBottom: 24,
            }}>
              <Text style={{ color: COLORS.errorText, fontSize: 14, fontWeight: '500' }}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 8 }}>
              E-Mail
            </Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@email.de"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={setEmail}
              style={{
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                fontSize: 16,
                color: COLORS.text,
              }}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 8 }}>
              Passwort
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 14,
            }}>
              <TextInput
                placeholder="••••••"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: COLORS.text,
                }}
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 16 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.textSecondary} />
                ) : (
                  <Eye size={20} color={COLORS.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Buttons - 90% Breite */}
          <View style={{ alignItems: 'center', gap: 16 }}>
            <TouchableOpacity 
              style={{
                backgroundColor: COLORS.accent,
                width: '90%',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 3,
              }}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
                {loading ? 'Lädt...' : 'Einloggen'}
              </Text>
            </TouchableOpacity>

            <Pressable onPress={() => router.push('/auth/forgot-password')}>
              <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '500' }}>
                Passwort vergessen?
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push('/auth/signup')} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
                Noch kein Account?{' '}
                <Text style={{ fontWeight: '600', color: COLORS.primary }}>Registrieren</Text>
              </Text>
            </Pressable>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
