// app/auth/signup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';
import { z } from 'zod';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  whiteTransparent: 'rgba(255,255,255,0.7)',
  error: '#FF4D4D',
  errorBg: 'rgba(255,77,77,0.12)',
  placeholder: '#8A8A8A',
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

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(30)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(inputTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(inputOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleSignup = async () => {
    setErrors({});

    if (!selectedRole) {
      Alert.alert('Fehler', 'Bitte wähle eine Rolle (Worker oder Employer)');
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
      await signUp(result.data.email, result.data.password, selectedRole);
      router.replace('/start');
    } catch (error: any) {
      setErrors({ email: error.message || 'Registrierung fehlgeschlagen' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }} keyboardShouldPersistTaps="handled">
            
            {/* LOGO MIT DUNKELLILA HINTERGRUND - VOLLE BREITE */}
            <View style={{ width: '100%', marginHorizontal: -24, backgroundColor: '#9333EA', paddingVertical: 40, marginBottom: 40, alignItems: 'center' }}>
              <Animated.View style={{ alignItems: 'center', opacity: logoOpacity }}>
                <Image
                  source={{ uri: 'https://customer-assets.emergentagent.com/job_129a3665-288c-42bb-9ab2-25aee1dfc3eb/artifacts/vsoiolte_Black%20White%20Minimal%20Simple%20Modern%20Letter%20A%20%20Arts%20Gallery%20%20Logo-11.png' }}
                  style={{ width: 180, height: 180 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            <Animated.View style={{ marginBottom: 8, opacity: logoOpacity }}>
              <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.white, textAlign: 'center' }}>Erstelle deinen{"\n"}Quickjobs-Account</Text>
            </Animated.View>

            <Animated.View style={{ marginBottom: 40, opacity: logoOpacity }}>
              <Text style={{ fontSize: 15, color: COLORS.whiteTransparent, textAlign: 'center', fontWeight: '500' }}>Schnell. Sicher. Sofort einsatzbereit.</Text>
            </Animated.View>

            <Animated.View style={{ opacity: inputOpacity, transform: [{ translateY: inputTranslateY }] }}>
              
              {/* Role Selection */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>Rolle wählen</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => setSelectedRole('worker')} style={{ flex: 1, backgroundColor: selectedRole === 'worker' ? COLORS.neon : COLORS.white, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedRole === 'worker' ? COLORS.neon : 'transparent' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Auftragnehmer</Text>
                  </Pressable>
                  <Pressable onPress={() => setSelectedRole('employer')} style={{ flex: 1, backgroundColor: selectedRole === 'employer' ? COLORS.neon : COLORS.white, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedRole === 'employer' ? COLORS.neon : 'transparent' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Auftraggeber</Text>
                  </Pressable>
                </View>
              </View>

              {/* Email */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>E-Mail</Text>
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 2, borderColor: emailFocused ? COLORS.neon : 'transparent', minHeight: 56, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="name@email.de" placeholderTextColor={COLORS.placeholder} value={email} onChangeText={setEmail} onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} style={{ fontSize: 16, color: COLORS.black, fontWeight: '500' }} />
                </View>
                {errors.email && <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.errorBg, borderRadius: 8 }}><Text style={{ fontSize: 13, color: COLORS.error, fontWeight: '600' }}>{errors.email}</Text></View>}
              </View>

              {/* Password */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>Passwort</Text>
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 2, borderColor: passwordFocused ? COLORS.neon : 'transparent', minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput placeholder="Mindestens 6 Zeichen" placeholderTextColor={COLORS.placeholder} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} style={{ flex: 1, fontSize: 16, color: COLORS.black, fontWeight: '500' }} />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 12 }}>
                    {showPassword ? <EyeOff size={22} color={COLORS.placeholder} /> : <Eye size={22} color={COLORS.placeholder} />}
                  </Pressable>
                </View>
                {errors.password && <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.errorBg, borderRadius: 8 }}><Text style={{ fontSize: 13, color: COLORS.error, fontWeight: '600' }}>{errors.password}</Text></View>}
              </View>

              {/* Confirm Password */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>Passwort bestätigen</Text>
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 2, borderColor: confirmFocused ? COLORS.neon : 'transparent', minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput placeholder="Passwort wiederholen" placeholderTextColor={COLORS.placeholder} secureTextEntry={!showConfirm} value={confirm} onChangeText={setConfirm} onFocus={() => setConfirmFocused(true)} onBlur={() => setConfirmFocused(false)} style={{ flex: 1, fontSize: 16, color: COLORS.black, fontWeight: '500' }} />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ paddingLeft: 12 }}>
                    {showConfirm ? <EyeOff size={22} color={COLORS.placeholder} /> : <Eye size={22} color={COLORS.placeholder} />}
                  </Pressable>
                </View>
                {errors.confirm && <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.errorBg, borderRadius: 8 }}><Text style={{ fontSize: 13, color: COLORS.error, fontWeight: '600' }}>{errors.confirm}</Text></View>}
              </View>
            </Animated.View>

            <View style={{ flex: 1, minHeight: 20 }} />

            <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] }}>
              <Pressable onPress={handleSignup} disabled={loading} style={({ pressed }) => ({ backgroundColor: loading ? '#B3B3B3' : COLORS.neon, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, opacity: pressed ? 0.9 : 1 })}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>{loading ? 'Wird erstellt...' : 'Account erstellen'}</Text>
              </Pressable>

              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 15, color: COLORS.whiteTransparent, marginBottom: 8 }}>Schon einen Account?</Text>
                <Pressable onPress={() => router.push('/auth/login')}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon }}>Login</Text>
                </Pressable>
              </View>
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
