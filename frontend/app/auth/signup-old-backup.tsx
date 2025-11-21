// app/auth/signup.tsx - VIVID BLUE-PURPLE & NEON LIME
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';
import { z } from 'zod';

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
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
              Account erstellen
            </Text>
          </View>

          {/* Subtitle */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.textSecondary }}>
              Beginne in weniger als 1 Minute.
            </Text>
          </View>

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
                borderColor: errors.email ? COLORS.errorBorder : COLORS.border,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                fontSize: 16,
                color: COLORS.text,
              }}
            />
            {errors.email && (
              <Text style={{ fontSize: 12, color: COLORS.errorText, marginTop: 6 }}>
                {errors.email}
              </Text>
            )}
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 8 }}>
              Passwort
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: errors.password ? COLORS.errorBorder : COLORS.border,
              borderRadius: 14,
            }}>
              <TextInput
                placeholder="Mindestens 6 Zeichen"
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
            {errors.password && (
              <Text style={{ fontSize: 12, color: COLORS.errorText, marginTop: 6 }}>
                {errors.password}
              </Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.text, marginBottom: 8 }}>
              Passwort bestätigen
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: errors.confirm ? COLORS.errorBorder : COLORS.border,
              borderRadius: 14,
            }}>
              <TextInput
                placeholder="Passwort wiederholen"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: COLORS.text,
                }}
              />
              <Pressable 
                onPress={() => setShowConfirm(!showConfirm)}
                style={{ paddingHorizontal: 16 }}
              >
                {showConfirm ? (
                  <EyeOff size={20} color={COLORS.textSecondary} />
                ) : (
                  <Eye size={20} color={COLORS.textSecondary} />
                )}
              </Pressable>
            </View>
            {errors.confirm && (
              <Text style={{ fontSize: 12, color: COLORS.errorText, marginTop: 6 }}>
                {errors.confirm}
              </Text>
            )}
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
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
                {loading ? 'Wird erstellt...' : 'Registrieren'}
              </Text>
            </TouchableOpacity>

            <Pressable onPress={() => router.push('/auth/login')} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
                Schon einen Account?{' '}
                <Text style={{ fontWeight: '600', color: COLORS.primary }}>Einloggen</Text>
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
