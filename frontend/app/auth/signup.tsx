// app/auth/signup.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bgDark: '#0E0B1F',
  bgCard: '#141126',
  purple: '#6B4BFF',
  purpleLight: '#7C5CFF',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
  neon: '#C8FF16'
};

export default function SignupScreen() {
  const router = useRouter();

  // Animations
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }} keyboardShouldPersistTaps="handled">
            
            <Animated.View style={{ alignItems: 'center', marginBottom: 32, opacity: logoOpacity }}>
              <View style={{ width: 100, height: 100, backgroundColor: COLORS.neon, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }} style={{ width: 70, height: 70 }} resizeMode="contain" />
              </View>
            </Animated.View>

            <Animated.View style={{ marginBottom: 8, opacity: logoOpacity }}>
              <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.white, textAlign: 'center' }}>Erstelle deinen{"\n"}BACKUP-Account</Text>
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

              {/* Account Type Selection (nur für Employer) */}
              {selectedRole === 'employer' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>Wie trittst du auf?</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => setSelectedAccountType('private')} style={{ flex: 1, backgroundColor: selectedAccountType === 'private' ? COLORS.neon : COLORS.white, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedAccountType === 'private' ? COLORS.neon : 'transparent' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Privatperson</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedAccountType('business')} style={{ flex: 1, backgroundColor: selectedAccountType === 'business' ? COLORS.neon : COLORS.white, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: selectedAccountType === 'business' ? COLORS.neon : 'transparent' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Unternehmen</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>E-Mail</Text>
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 2, borderColor: emailFocused ? COLORS.neon : 'transparent', minHeight: 56, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="name@email.de" placeholderTextColor={COLORS.placeholder} value={email} onChangeText={(text) => setEmail(text.trim())} onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} style={{ fontSize: 16, color: COLORS.black, fontWeight: '500' }} />
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
