// app/(employer)/profile.tsx - FINAL NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployerProfile, saveEmployerProfile, EmployerProfile } from '../../utils/employerProfileStore';
import { ProfilePhoto } from '../../components/ProfilePhoto';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  whiteTransparent: 'rgba(255,255,255,0.7)',
  neonShadow: 'rgba(200,255,22,0.2)',
};

export default function EmployerProfileScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);
  const [shortBio, setShortBio] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>(undefined);

  // Focus States
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Neon Glimmer Effect (Loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
    }
  }, [authLoading, user]);

  async function loadProfile() {
    if (!user) return;

    try {
      const stored = await getEmployerProfile(user.id);
      if (stored) {
        setFirstName(stored.firstName || '');
        setLastName(stored.lastName || '');
        setCompany(stored.company || '');
        setPhone(stored.phone || '');
        setEmail(stored.email || user.email || '');
        setStreet(stored.street || '');
        setPostalCode(stored.postalCode || '');
        setCity(stored.city || '');
        setPaymentMethod(stored.paymentMethod || null);
        setShortBio(stored.shortBio || '');
        setProfilePhotoUri(stored.profilePhotoUri);
      } else {
        // Initialize with user email
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    // Validation
    if (!firstName.trim()) {
      Alert.alert('Fehler', 'Bitte Vorname eingeben');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Fehler', 'Bitte Nachname eingeben');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Fehler', 'Bitte Telefonnummer eingeben');
      return;
    }
    if (!street.trim() || !postalCode.trim() || !city.trim()) {
      Alert.alert('Fehler', 'Bitte Rechnungsadresse vollständig ausfüllen');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Fehler', 'Bitte Zahlart wählen');
      return;
    }

    setSaving(true);
    try {
      const profile: EmployerProfile = {
        userId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        street: street.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        paymentMethod,
        shortBio: shortBio.trim() || undefined,
        profilePhotoUri,
      };

      await saveEmployerProfile(profile);
      Alert.alert('Erfolg', 'Profil gespeichert!', [
        { text: 'OK', onPress: () => router.push('/(employer)') }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace('/start');
  }

  if (authLoading) return null;
  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <Animated.View style={{
        position: 'absolute',
        top: -80,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: glimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.08, 0.15],
        }),
        blur: 60,
      }} />

      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
            Mein Profil
          </Text>
          <Pressable onPress={handleLogout}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.neon }}>
              Logout
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 60,
              height: 60,
              backgroundColor: COLORS.neon,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Image
                source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
                style={{ width: 42, height: 42 }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Header */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.white, textAlign: 'center', marginBottom: 8 }}>
              Dein Auftraggeber-Profil
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.whiteTransparent, textAlign: 'center' }}>
              Diese Daten werden erst nach einem Match freigeschaltet.
            </Text>
          </View>

          {/* Profilfoto */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              padding: 4,
              borderRadius: 60,
              borderWidth: 3,
              borderColor: COLORS.neon,
            }}>
              <ProfilePhoto
                uri={profilePhotoUri}
                size={100}
                onPhotoSelected={(uri) => setProfilePhotoUri(uri)}
              />
            </View>
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Ionicons name="cloud-upload-outline" size={20} color={COLORS.neon} />
              <Text style={{ fontSize: 12, color: COLORS.neon, marginTop: 4, fontWeight: '600' }}>
                Logo / Foto hochladen
              </Text>
            </View>
          </View>

          {/* Persönliche Daten */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              PERSÖNLICHE DATEN
            </Text>

            {/* Vorname */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                Vorname *
              </Text>
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'firstName' ? COLORS.neon : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Vorname"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  style={{ fontSize: 16, color: COLORS.black }}
                />
              </View>
            </View>

            {/* Nachname */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                Nachname *
              </Text>
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'lastName' ? COLORS.neon : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nachname"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  style={{ fontSize: 16, color: COLORS.black }}
                />
              </View>
            </View>

            {/* Firma */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                Firma (optional)
              </Text>
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'company' ? COLORS.neon : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Firmenname"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedField('company')}
                  onBlur={() => setFocusedField(null)}
                  style={{ fontSize: 16, color: COLORS.black }}
                />
              </View>
            </View>
          </View>

          {/* Kontakt & Firma */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              KONTAKT
            </Text>

            {/* Telefonnummer */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                Telefonnummer *
              </Text>
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'phone' ? COLORS.neon : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+49 123 456789"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  style={{ fontSize: 16, color: COLORS.black }}
                />
              </View>
            </View>

            {/* E-Mail */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                Kontakt-E-Mail
              </Text>
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'email' ? COLORS.neon : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@email.de"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={{ fontSize: 16, color: COLORS.black }}
                />
              </View>
            </View>
          </View>

          {/* Rechnungsadresse */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              RECHNUNGSADRESSE
            </Text>

            {/* Straße */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                Straße & Hausnummer *
              </Text>
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'street' ? COLORS.neon : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Musterstr. 123"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedField('street')}
                  onBlur={() => setFocusedField(null)}
                  style={{ fontSize: 16, color: COLORS.black }}
                />
              </View>
            </View>

            {/* PLZ & Stadt */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                  PLZ *
                </Text>
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: focusedField === 'postalCode' ? COLORS.neon : 'transparent',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}>
                  <TextInput
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="12345"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    onFocus={() => setFocusedField('postalCode')}
                    onBlur={() => setFocusedField(null)}
                    style={{ fontSize: 16, color: COLORS.black }}
                  />
                </View>
              </View>

              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
                  Stadt *
                </Text>
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: focusedField === 'city' ? COLORS.neon : 'transparent',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Berlin"
                    placeholderTextColor="#999"
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                    style={{ fontSize: 16, color: COLORS.black }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Zahlungsdaten */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              ZAHLUNGSDATEN
            </Text>

            <Text style={{ fontSize: 13, color: COLORS.darkGray, marginBottom: 16 }}>
              Für die 20% BACKUP-Provision
            </Text>

            {/* Kreditkarte */}
            <Pressable
              onPress={() => setPaymentMethod('card')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 12,
                backgroundColor: paymentMethod === 'card' ? COLORS.neon : '#F8F8F8',
                marginBottom: 12,
              }}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: paymentMethod === 'card' ? COLORS.black : COLORS.darkGray,
                backgroundColor: paymentMethod === 'card' ? COLORS.black : 'transparent',
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {paymentMethod === 'card' && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.neon }} />
                )}
              </View>
              <Ionicons name="card-outline" size={24} color={paymentMethod === 'card' ? COLORS.black : COLORS.darkGray} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: paymentMethod === 'card' ? '700' : '600', color: paymentMethod === 'card' ? COLORS.black : COLORS.darkGray }}>
                Kreditkarte
              </Text>
            </Pressable>

            {/* PayPal */}
            <Pressable
              onPress={() => setPaymentMethod('paypal')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 12,
                backgroundColor: paymentMethod === 'paypal' ? COLORS.neon : '#F8F8F8',
              }}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: paymentMethod === 'paypal' ? COLORS.black : COLORS.darkGray,
                backgroundColor: paymentMethod === 'paypal' ? COLORS.black : 'transparent',
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {paymentMethod === 'paypal' && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.neon }} />
                )}
              </View>
              <Ionicons name="logo-paypal" size={24} color={paymentMethod === 'paypal' ? COLORS.black : COLORS.darkGray} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: paymentMethod === 'paypal' ? '700' : '600', color: paymentMethod === 'paypal' ? COLORS.black : COLORS.darkGray }}>
                PayPal
              </Text>
            </Pressable>
          </View>

          {/* Über dich */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              ÜBER DICH
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 8 }}>
              Wer bist du als Auftraggeber?
            </Text>
            <TextInput
              value={shortBio}
              onChangeText={setShortBio}
              placeholder="Kurze Beschreibung (z.B. 'Ich betreibe ein Restaurant und suche regelmäßig Hilfe für Events.')"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              style={{
                fontSize: 15,
                color: COLORS.black,
                backgroundColor: '#F8F8F8',
                borderRadius: 12,
                padding: 16,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Buttons */}
          <View style={{ gap: 12, marginTop: 20 }}>
            {/* Primary Save */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: saving ? '#E8E8E8' : COLORS.neon,
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
                shadowColor: !saving ? COLORS.neon : 'transparent',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: saving ? COLORS.darkGray : COLORS.black }}>
                {saving ? 'Speichert...' : 'Profil speichern'}
              </Text>
            </Pressable>

            {/* Secondary */}
            <Pressable
              onPress={() => router.push('/(employer)')}
              style={({ pressed }) => ({
                backgroundColor: 'transparent',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: COLORS.neon,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon }}>
                Weiter zu meinen Aufträgen
              </Text>
            </Pressable>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 60 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
