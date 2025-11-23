// app/auth/login.tsx - FINAL NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';
import DevResetButton from '../../components/DevResetButton';

// BACKUP NEON-TECH COLORS
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Focus States
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animation Values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(30)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered Animations
    Animated.sequence([
      // Logo Fade-in
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Inputs Slide-in
      Animated.parallel([
        Animated.timing(inputTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Buttons Rise-up
      Animated.parallel([
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  async function handleLogin() {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      // Redirect based on role
      if (user.role === 'worker') {
        router.replace('/(worker)/feed');
      } else if (user.role === 'employer') {
        router.replace('/(employer)/dashboard');
      } else {
        router.replace('/start');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Optional Vertical Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -100,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.15,
        blur: 80,
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1, 
              paddingHorizontal: 24,
              paddingVertical: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo - Animated Fade-in */}
            <Animated.View style={{ 
              alignItems: 'center', 
              marginBottom: 32,
              opacity: logoOpacity,
            }}>
              <View style={{
                width: 100,
                height: 100,
                backgroundColor: COLORS.neon,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: COLORS.purple,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}>
                <Image
                  source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
                  style={{ width: 70, height: 70 }}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            {/* Headline */}
            <Animated.View style={{ 
              marginBottom: 8,
              opacity: logoOpacity,
            }}>
              <Text style={{ 
                fontSize: 30, 
                fontWeight: '900', 
                color: COLORS.white,
                textAlign: 'center',
                letterSpacing: 0.2,
              }}>
                Willkommen zurück!
              </Text>
            </Animated.View>

            {/* Subheadline */}
            <Animated.View style={{ 
              marginBottom: 40,
              opacity: logoOpacity,
            }}>
              <Text style={{ 
                fontSize: 15, 
                color: COLORS.whiteTransparent,
                textAlign: 'center',
                fontWeight: '500',
              }}>
                Melde dich an und leg direkt los.
              </Text>
            </Animated.View>

            {/* Error Banner */}
            {errorMsg ? (
              <Animated.View style={{
                marginBottom: 24,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: COLORS.errorBg,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.error,
                opacity: inputOpacity,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.error, fontWeight: '600' }}>
                  {errorMsg}
                </Text>
              </Animated.View>
            ) : null}

            {/* Inputs - Animated Slide-in */}
            <Animated.View style={{
              opacity: inputOpacity,
              transform: [{ translateY: inputTranslateY }],
            }}>
              {/* Email Input */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: COLORS.neon,
                  marginBottom: 8,
                }}>
                  E-Mail
                </Text>
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: emailFocused ? COLORS.neon : 'transparent',
                  minHeight: 56,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                }}>
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
                      color: COLORS.black,
                      fontWeight: '500',
                    }}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: COLORS.neon,
                  marginBottom: 8,
                }}>
                  Passwort
                </Text>
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: passwordFocused ? COLORS.neon : 'transparent',
                  minHeight: 56,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
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
                      color: COLORS.black,
                      fontWeight: '500',
                    }}
                  />
                  <Pressable 
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingLeft: 12 }}
                  >
                    {showPassword ? (
                      <EyeOff size={22} color={COLORS.placeholder} />
                    ) : (
                      <Eye size={22} color={COLORS.placeholder} />
                    )}
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            {/* Spacer */}
            <View style={{ flex: 1, minHeight: 20 }} />

            {/* Buttons - Animated Rise-up */}
            <Animated.View style={{
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            }}>
              {/* Primary Button */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => ({
                  backgroundColor: loading ? '#B3B3B3' : COLORS.neon,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                })}
              >
                <Text style={{ 
                  fontSize: 17, 
                  fontWeight: '700', 
                  color: COLORS.black,
                  letterSpacing: 0.3,
                }}>
                  {loading ? 'Lädt...' : 'Einloggen'}
                </Text>
              </Pressable>

              {/* Ghost Button - Forgot Password */}
              <Pressable 
                onPress={() => router.push('/auth/forgot-password')}
                style={{ alignItems: 'center', marginBottom: 24 }}
              >
                <Text style={{ 
                  fontSize: 15, 
                  fontWeight: '600', 
                  color: COLORS.neon,
                }}>
                  Passwort vergessen?
                </Text>
              </Pressable>

              {/* Footer - Signup Link */}
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ 
                  fontSize: 15, 
                  color: COLORS.whiteTransparent,
                  marginBottom: 8,
                }}>
                  Noch kein Account?
                </Text>
                <Pressable onPress={() => router.push('/auth/signup')}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: COLORS.neon,
                    letterSpacing: 0.2,
                  }}>
                    Registrieren
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Dev Reset Button */}
            <DevResetButton />

            {/* Bottom Padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
