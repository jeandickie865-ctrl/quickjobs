// app/auth/login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  white: '#1A1A1A',
  cardText: "#00A07C",
  muted: 'rgba(0,0,0,0.6)',
  placeholder: 'rgba(0,0,0,0.4)',
  purple: '#EFABFF',
  purple2: '#EFABFF',
  neon: '#EFABFF',
  border: 'rgba(0,0,0,0.08)',
  error: '#EFABFF',
  errorBg: 'rgba(230,74,74,0.12)'
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
        Animated.timing(inputOpacity, { toValue: 1, duration: 400, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
      ])
    ]).start();
  }, []);

  async function handleLogin() {
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/start');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login fehlgeschlagen. Bitte überprüfe deine E-Mail und Passwort.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ArrowDoodle />


        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingVertical: 40
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* HEADER */}
            <View style={{ marginBottom: 50 }}>
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: '900',
                  fontSize: 28,
                  letterSpacing: 1
                }}
              >
                Quickjobs
              </Text>
              <View
                style={{
                  marginTop: 8,
                  height: 4,
                  width: '100%',
                  backgroundColor: COLORS.purple
                }}
              />
            </View>

            {/* LOGO */}
            <Animated.View style={{ alignItems: 'center', marginBottom: 32, opacity: logoOpacity }}>
              <View
                style={{
                  width: 90,
                  height: 90,
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border
                }}
              >
                <Image
                  source={{
                    uri:
                      'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png'
                  }}
                  style={{ width: 60, height: 60 }}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            {/* HEADLINE */}
            <Animated.View style={{ marginBottom: 8, opacity: logoOpacity }}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: COLORS.white,
                  textAlign: 'center'
                }}
              >
                Willkommen zurück
              </Text>
            </Animated.View>

            <Animated.View style={{ marginBottom: 32, opacity: logoOpacity }}>
              <Text
                style={{
                  fontSize: 15,
                  color: COLORS.muted,
                  textAlign: 'center',
                  fontWeight: '500'
                }}
              >
                Melde dich an und leg los
              </Text>
            </Animated.View>

            {/* ERROR */}
            {errorMsg ? (
              <Animated.View
                style={{
                  marginBottom: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: COLORS.errorBg,
                  borderRadius: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: COLORS.error,
                  opacity: inputOpacity
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.error, fontWeight: '600' }}>
                  {errorMsg}
                </Text>
              </Animated.View>
            ) : null}

            {/* INPUTS */}
            <Animated.View
              style={{ opacity: inputOpacity, transform: [{ translateY: inputTranslateY }] }}
            >
              {/* EMAIL */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.neon,
                    marginBottom: 8
                  }}
                >
                  E-Mail
                </Text>

                <View
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: emailFocused ? COLORS.neon : COLORS.border,
                    height: 56,
                    paddingHorizontal: 16,
                    justifyContent: 'center'
                  }}
                >
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="name@email.de"
                    placeholderTextColor={COLORS.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={{
                      fontSize: 16,
                      color: COLORS.white,
                      fontWeight: '500'
                    }}
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={{ marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.neon,
                    marginBottom: 8
                  }}
                >
                  Passwort
                </Text>

                <View
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: passwordFocused ? COLORS.neon : COLORS.border,
                    height: 56,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: COLORS.white,
                      fontWeight: '500'
                    }}
                  />

                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 12 }}>
                    {showPassword ? (
                      <EyeOff size={22} color={COLORS.placeholder} />
                    ) : (
                      <Eye size={22} color={COLORS.placeholder} />
                    )}
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            <View style={{ flex: 1, minHeight: 20 }} />

            {/* BUTTON + SIGNUP */}
            <Animated.View
              style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] }}
            >
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => ({
                  backgroundColor: loading ? '#999' : COLORS.purple,
                  height: 56,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  width: '60%',
                  maxWidth: 300,
                  minWidth: 220,
                  alignSelf: 'center',
                  opacity: pressed ? 0.9 : 1
                })}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: COLORS.white
                  }}
                >
                  {loading ? 'Lädt...' : 'Einloggen'}
                </Text>
              </Pressable>

              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 15, color: COLORS.muted, marginBottom: 8 }}>
                  Noch kein Account?
                </Text>

                <Pressable onPress={() => router.push('/auth/signup')}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon }}>
                    Registrieren
                  </Text>
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
