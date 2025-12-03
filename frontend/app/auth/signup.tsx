// app/auth/signup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bgDark: '#0E0B1F',
  bgCard: '#141126',
  purple: '#6B4BFF',
  purpleLight: '#7C5CFF',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  neon: '#C8FF16',
  error: '#FF4D4D',
  errorBg: 'rgba(255,77,77,0.12)',
};

const signupSchema = z.object({
  email: z.string().min(1, 'E-Mail erforderlich').email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
  confirm: z.string().min(1, 'Passwort-Bestätigung erforderlich'),
}).refine((data) => data.password === data.confirm, {
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
  const [selectedRole, setSelectedRole] = useState<'worker' | 'employer' | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<'private' | 'business'>('private');

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, []);

  const handleSignup = async () => {
    setErrors({});

    if (!selectedRole) {
      Alert.alert('Fehler', 'Bitte wähle eine Rolle (Auftragnehmer oder Auftraggeber)');
      return;
    }

    const result = signupSchema.safeParse({ email: email.trim(), password, confirm });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await signUp(result.data.email, result.data.password, selectedRole, selectedAccountType);
      
      // Nach Registrierung: Worker direkt zur Profil-Erstellung, Employer zum Dashboard
      if (selectedRole === 'worker') {
        router.replace('/(worker)/profile-wizard/step1-basic');
      } else {
        router.replace('/(employer)');
      }
    } catch (error: any) {
      setErrors({ email: error.message || 'Registrierung fehlgeschlagen' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bgDark, COLORS.bgCard]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }} keyboardShouldPersistTaps="handled">
            
            {/* HEADER */}
            <Animated.View style={{ marginBottom: 32, opacity: fade, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.white, marginBottom: 8 }}>
                BACKUP
              </Text>
              <View style={{ width: 55, height: 3, backgroundColor: COLORS.neon, borderRadius: 2, marginBottom: 24 }} />
              <Text style={{ fontSize: 16, color: COLORS.muted, textAlign: 'center' }}>
                Erstelle deinen Account
              </Text>
            </Animated.View>

            <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
              
              {/* Role Selection */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>Rolle wählen</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => setSelectedRole('worker')} style={{ flex: 1, backgroundColor: selectedRole === 'worker' ? COLORS.purple : 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedRole === 'worker' ? COLORS.purple : 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>Auftragnehmer</Text>
                  </Pressable>
                  <Pressable onPress={() => setSelectedRole('employer')} style={{ flex: 1, backgroundColor: selectedRole === 'employer' ? COLORS.purple : 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedRole === 'employer' ? COLORS.purple : 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>Auftraggeber</Text>
                  </Pressable>
                </View>
              </View>

              {/* Account Type Selection (nur für Employer) */}
              {selectedRole === 'employer' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>Wie trittst du auf?</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => setSelectedAccountType('private')} style={{ flex: 1, backgroundColor: selectedAccountType === 'private' ? COLORS.purpleLight : 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedAccountType === 'private' ? COLORS.purpleLight : 'rgba(255,255,255,0.07)' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>Privatperson</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedAccountType('business')} style={{ flex: 1, backgroundColor: selectedAccountType === 'business' ? COLORS.purpleLight : 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedAccountType === 'business' ? COLORS.purpleLight : 'rgba(255,255,255,0.07)' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>Unternehmen</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>E-Mail</Text>
                <View style={{ backgroundColor: COLORS.bgCard, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minHeight: 56, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="name@email.de" placeholderTextColor="rgba(255,255,255,0.4)" value={email} onChangeText={(text) => setEmail(text.trim())} style={{ fontSize: 16, color: COLORS.white }} />
                </View>
                {errors.email && <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.errorBg, borderRadius: 8 }}><Text style={{ fontSize: 13, color: COLORS.error, fontWeight: '600' }}>{errors.email}</Text></View>}
              </View>

              {/* Password */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>Passwort</Text>
                <View style={{ backgroundColor: COLORS.bgCard, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput placeholder="Mindestens 6 Zeichen" placeholderTextColor="rgba(255,255,255,0.4)" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={{ flex: 1, fontSize: 16, color: COLORS.white }} />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 12 }}>
                    {showPassword ? <EyeOff size={22} color={COLORS.muted} /> : <Eye size={22} color={COLORS.muted} />}
                  </Pressable>
                </View>
                {errors.password && <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.errorBg, borderRadius: 8 }}><Text style={{ fontSize: 13, color: COLORS.error, fontWeight: '600' }}>{errors.password}</Text></View>}
              </View>

              {/* Confirm Password */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>Passwort bestätigen</Text>
                <View style={{ backgroundColor: COLORS.bgCard, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput placeholder="Passwort wiederholen" placeholderTextColor="rgba(255,255,255,0.4)" secureTextEntry={!showConfirm} value={confirm} onChangeText={setConfirm} style={{ flex: 1, fontSize: 16, color: COLORS.white }} />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ paddingLeft: 12 }}>
                    {showConfirm ? <EyeOff size={22} color={COLORS.muted} /> : <Eye size={22} color={COLORS.muted} />}
                  </Pressable>
                </View>
                {errors.confirm && <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.errorBg, borderRadius: 8 }}><Text style={{ fontSize: 13, color: COLORS.error, fontWeight: '600' }}>{errors.confirm}</Text></View>}
              </View>
            </Animated.View>

            <View style={{ flex: 1, minHeight: 20 }} />

            <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
              <Pressable onPress={handleSignup} disabled={loading} style={({ pressed }) => ({ backgroundColor: loading ? 'rgba(255,255,255,0.2)' : COLORS.purple, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, opacity: pressed ? 0.9 : 1 })}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>{loading ? 'Wird erstellt...' : 'Account erstellen'}</Text>
              </Pressable>

              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 15, color: COLORS.muted, marginBottom: 8 }}>Schon einen Account?</Text>
                <Pressable onPress={() => router.push('/auth/login')}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white, textDecorationLine: 'underline' }}>Login</Text>
                </Pressable>
              </View>
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
