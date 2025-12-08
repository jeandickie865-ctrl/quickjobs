// app/auth/forgot-password.tsx - FINAL NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#FFFFFF',
  black: '#000000',
  whiteTransparent: 'rgba(255,255,255,0.6)',
  error: '#E64A4A',
  errorBg: 'rgba(230,74,74,0.12)',
  placeholder: '#8A8A8A',
  success: '#00D26A',
  successBg: 'rgba(0,210,106,0.12)',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Soft Fade-in Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetLink = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!email.trim()) {
      setErrorMsg('Bitte E-Mail-Adresse eingeben');
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMsg('Ungültige E-Mail-Adresse');
      return;
    }

    setLoading(true);

    // Simulate API call (2 seconds)
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('✓ Link zum Zurücksetzen wurde an deine E-Mail gesendet!');
      
      // Auto-redirect nach 3 Sekunden
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Optional Vertical Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        marginLeft: -100,
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
              opacity: fadeAnim,
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
              opacity: fadeAnim,
            }}>
              <Text style={{ 
                fontSize: 30, 
                fontWeight: '900', 
                color: COLORS.white,
                textAlign: 'center',
                letterSpacing: 0.2,
              }}>
                Passwort{'\n'}zurücksetzen
              </Text>
            </Animated.View>

            {/* Subheadline */}
            <Animated.View style={{ 
              marginBottom: 40,
              opacity: fadeAnim,
            }}>
              <Text style={{ 
                fontSize: 15, 
                color: COLORS.whiteTransparent,
                textAlign: 'center',
                fontWeight: '500',
              }}>
                Wir schicken dir einen Link{'\n'}zum Zurücksetzen.
              </Text>
            </Animated.View>

            {/* Success Message */}
            {successMsg ? (
              <Animated.View style={{
                marginBottom: 24,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: COLORS.successBg,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.success,
                opacity: fadeAnim,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.success, fontWeight: '600' }}>
                  {successMsg}
                </Text>
              </Animated.View>
            ) : null}

            {/* Error Message */}
            {errorMsg ? (
              <Animated.View style={{
                marginBottom: 24,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: COLORS.errorBg,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.error,
                opacity: fadeAnim,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.error, fontWeight: '600' }}>
                  {errorMsg}
                </Text>
              </Animated.View>
            ) : null}

            {/* Email Input - Animated */}
            <Animated.View style={{
              marginBottom: 32,
              opacity: fadeAnim,
            }}>
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
                  editable={!successMsg}
                  style={{
                    fontSize: 16,
                    color: COLORS.black,
                    fontWeight: '500',
                  }}
                />
              </View>
            </Animated.View>

            {/* Spacer */}
            <View style={{ flex: 1, minHeight: 20 }} />

            {/* Buttons - Animated */}
            <Animated.View style={{
              opacity: fadeAnim,
            }}>
              {/* Primary Button */}
              {!successMsg && (
                <Pressable
                  onPress={handleSendResetLink}
                  disabled={loading}
                  style={({ pressed }) => ({
                    backgroundColor: loading ? '#B3B3B3' : COLORS.neon,
                    height: 56,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
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
                    {loading ? 'Wird gesendet...' : 'Link senden'}
                  </Text>
                </Pressable>
              )}

              {/* Secondary - Back to Login */}
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <Pressable onPress={() => router.push('/auth/login')}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: COLORS.neon,
                    letterSpacing: 0.2,
                  }}>
                    {successMsg ? '→ Weiter zum Login' : '← Zurück zum Login'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Bottom Padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
