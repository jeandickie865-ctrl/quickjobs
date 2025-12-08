// app/auth/signup.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from '../../components/Icons';
import { z } from 'zod';
import { ArrowDoodle } from '../../components/ArrowDoodle';

const COLORS = {
  bg: '#FFFFFF',
  white: '#1A1A1A',
  cardText: "#00A07C",
  whiteSoft: 'rgba(255,255,255,0.8)',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  border: 'rgba(0,0,0,0.08)',
  text: '#1A1A1A',
  placeholder: 'rgba(0,0,0,0.4)',
  orange: '#EFABFF',
  neon: '#EFABFF',
  accent: '#EFABFF',
  purple: '#EFABFF',
  muted: 'rgba(0,0,0,0.6)',
  error: '#EFABFF',
  errorBg: 'rgba(239,171,255,0.20)'
};

const SIZES = {
  buttonHeight: 48,
  inputHeight: 52,
  radius: 14,
  cardRadius: 16,
  padding: 24,
  gap: 16,
  sectionGap: 28,
};

const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'E-Mail erforderlich')
      .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Ungültige E-Mail-Adresse'
      ),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    confirm: z.string().min(1, 'Passwort-Bestätigung erforderlich')
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['confirm']
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
  const [selectedAccountType, setSelectedAccountType] =
    useState<'private' | 'business'>('private');

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
        Animated.timing(inputOpacity, { toValue: 1, duration: 400, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
      ])
    ]).start();
  }, []);

  const handleSignup = async () => {
    setErrors({});

    if (!selectedRole) {
      Alert.alert('Fehler', 'Bitte wähle eine Rolle (Worker oder Employer)');
      return;
    }

    const result = signupSchema.safeParse({
      email: email.trim(),
      password,
      confirm
    });

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

            {/* TITLE */}
            <Animated.View style={{ marginBottom: 8, opacity: logoOpacity }}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: COLORS.white,
                  textAlign: 'center'
                }}
              >
                Erstelle deinen{"\n"}Quickjobs-Account
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
                Schnell. Sicher. Bereit.
              </Text>
            </Animated.View>

            {/* INPUT WRAPPER */}
            <Animated.View
              style={{
                opacity: inputOpacity,
                transform: [{ translateY: inputTranslateY }]
              }}
            >
              {/* ROLE */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.neon,
                    marginBottom: 8
                  }}
                >
                  Rolle wählen
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setSelectedRole('worker')}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.card,
                      borderRadius: 14,
                      paddingVertical: 18,
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor:
                        selectedRole === 'worker' ? COLORS.orange : COLORS.cardBorder
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: COLORS.white
                      }}
                    >
                      Auftragnehmer
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedRole('employer')}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.card,
                      borderRadius: 14,
                      paddingVertical: 18,
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor:
                        selectedRole === 'employer' ? COLORS.orange : COLORS.cardBorder
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: COLORS.white
                      }}
                    >
                      Auftraggeber
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* ACCOUNT TYPE */}
              {selectedRole === 'employer' && (
                <View style={{ marginBottom: SIZES.sectionGap }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: COLORS.white,
                      marginBottom: SIZES.gap
                    }}
                  >
                    Art des Auftraggebers
                  </Text>

                  <View style={{ flexDirection: 'row', gap: SIZES.gap }}>
                    <Pressable
                      onPress={() => setSelectedAccountType('private')}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.card,
                        borderRadius: SIZES.radius,
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: COLORS.cardBorder
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: COLORS.white
                        }}
                      >
                        Privatperson
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setSelectedAccountType('business')}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.card,
                        borderRadius: SIZES.radius,
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: COLORS.cardBorder
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: COLORS.white
                        }}
                      >
                        Unternehmen
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

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
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: emailFocused ? COLORS.orange : COLORS.cardBorder,
                    paddingHorizontal: 16,
                    height: 52,
                    justifyContent: 'center'
                  }}
                >
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="deine@mail.de"
                    placeholderTextColor={COLORS.placeholder}
                    value={email}
                    onChangeText={(v) => setEmail(v.trim())}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={{
                      fontSize: 16,
                      color: COLORS.white,
                      fontWeight: '500'
                    }}
                  />
                </View>

                {errors.email && (
                  <View
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: COLORS.errorBg,
                      borderRadius: 8
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.error,
                        fontWeight: '600'
                      }}
                    >
                      {errors.email}
                    </Text>
                  </View>
                )}
              </View>

              {/* PASSWORD */}
              <View style={{ marginBottom: 20 }}>
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
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: passwordFocused ? COLORS.orange : COLORS.cardBorder,
                    height: 52,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <TextInput
                    placeholder="Mindestens 6 Zeichen"
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

                {errors.password && (
                  <View
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: COLORS.errorBg,
                      borderRadius: 8
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.error,
                        fontWeight: '600'
                      }}
                    >
                      {errors.password}
                    </Text>
                  </View>
                )}
              </View>

              {/* CONFIRM PASSWORD */}
              <View style={{ marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.neon,
                    marginBottom: 8
                  }}
                >
                  Passwort bestätigen
                </Text>

                <View
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: confirmFocused ? COLORS.orange : COLORS.cardBorder,
                    height: 52,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <TextInput
                    placeholder="Passwort wiederholen"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showConfirm}
                    value={confirm}
                    onChangeText={setConfirm}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: COLORS.white,
                      fontWeight: '500'
                    }}
                  />

                  <Pressable
                    onPress={() => setShowConfirm(!showConfirm)}
                    style={{ paddingLeft: 12 }}
                  >
                    {showConfirm ? (
                      <EyeOff size={22} color={COLORS.placeholder} />
                    ) : (
                      <Eye size={22} color={COLORS.placeholder} />
                    )}
                  </Pressable>
                </View>

                {errors.confirm && (
                  <View
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: COLORS.errorBg,
                      borderRadius: 8
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.error,
                        fontWeight: '600'
                      }}
                    >
                      {errors.confirm}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            <View style={{ flex: 1, minHeight: 20 }} />

            {/* BUTTON */}
            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }]
              }}
            >
              <Pressable
                onPress={handleSignup}
                disabled={loading}
                style={({ pressed }) => ({
                  backgroundColor: loading ? 'rgba(255,255,255,0.5)' : COLORS.white,
                  height: 52,
                  borderRadius: 14,
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
                    fontSize: 18,
                    fontWeight: '700',
                    color: COLORS.bg
                  }}
                >
                  {loading ? 'Wird erstellt...' : 'Account erstellen'}
                </Text>
              </Pressable>

              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.muted,
                    marginBottom: 8
                  }}
                >
                  Schon einen Account?
                </Text>

                <Pressable onPress={() => router.push('/auth/login')}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: COLORS.neon
                    }}
                  >
                    Login
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
