// app/auth/login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Animated, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  purple: '#6B4BFF',
  purpleDark: '#5941FF',
  neon: '#C8FF16',
  error: '#FF4D4D',
  errorBg: 'rgba(255,77,77,0.1)',
  inputBg: 'rgba(255,255,255,0.05)',
  placeholder: 'rgba(255,255,255,0.4)',
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
        Animated.timing(inputOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  async function handleLogin() {
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Login successful - navigate to start which will handle routing
      router.replace('/start');
    } catch (err: any) {
      console.error('Login error in handleLogin:', err);
      setErrorMsg(err.message || 'Login fehlgeschlagen. Bitte überprüfe deine E-Mail und Passwort.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0E0B1F', '#1A1535', '#0E0B1F']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Glow Effects */}
      <Animated.View style={[styles.glowCircle, { opacity: logoOpacity }]}>
        <LinearGradient
          colors={['rgba(107,75,255,0.3)', 'rgba(107,75,255,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            {/* Logo Section */}
            <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }} 
                  style={styles.logoImage} 
                  resizeMode="contain" 
                />
              </View>
            </Animated.View>

            {/* Title Section */}
            <Animated.View style={[styles.titleSection, { opacity: logoOpacity }]}>
              <Text style={styles.title}>Willkommen zurück!</Text>
              <Text style={styles.subtitle}>Melde dich an und leg direkt los.</Text>
            </Animated.View>

            {/* Error Message */}
            {errorMsg ? (
              <Animated.View style={[styles.errorContainer, { opacity: inputOpacity }]}>
                <BlurView intensity={20} tint="dark" style={styles.errorBlur}>
                  <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </BlurView>
              </Animated.View>
            ) : null}

            {/* Input Section */}
            <Animated.View style={{ opacity: inputOpacity, transform: [{ translateY: inputTranslateY }] }}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-Mail</Text>
                <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="name@email.de"
                    placeholderTextColor={COLORS.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passwort</Text>
                <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    {showPassword ? <EyeOff size={20} color={COLORS.muted} /> : <Eye size={20} color={COLORS.muted} />}
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            <View style={{ flex: 1, minHeight: 20 }} />

            {/* Button Section */}
            <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] }}>
              <Pressable 
                onPress={handleLogin} 
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                  pressed && styles.loginButtonPressed
                ]}
              >
                <LinearGradient
                  colors={loading ? ['#4A4A4A', '#3A3A3A'] : [COLORS.purple, COLORS.purpleDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Lädt...' : 'Einloggen'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Sign Up Link */}
              <View style={styles.signupSection}>
                <Text style={styles.signupText}>Noch kein Account?</Text>
                <Pressable onPress={() => router.push('/auth/signup')}>
                  <Text style={styles.signupLink}>Registrieren</Text>
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
