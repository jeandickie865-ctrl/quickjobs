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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  glowCircle: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.purple,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorBlur: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.errorBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(107,75,255,0.05)',
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  eyeButton: {
    paddingLeft: 12,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  signupSection: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 8,
  },
  signupLink: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.purple,
  },
});


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
