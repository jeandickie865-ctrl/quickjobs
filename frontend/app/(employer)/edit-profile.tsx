// app/(employer)/profile.tsx - CLEAN & FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  getEmployerProfile,
  saveEmployerProfile,
  EmployerProfile
} from '../../utils/employerProfileStore';
import AddressAutocompleteInput from '../../components/AddressAutocompleteInput';
import { Ionicons } from '@expo/vector-icons';
import { getApplicationsForEmployer } from '../../utils/applicationStore';

// COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  whiteTransparent: 'rgba(255,255,255,0.7)',
  textPrimary: "#000000",
  textSecondary: "#333333",
  accentNeon: "#C8FF16",
};

export default function EmployerProfileScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);

  // FORM STATES
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);
  const [shortBio, setShortBio] = useState('');

  // Focus for neon border
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ANIMATION
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
      loadMatchesCount();
    }
  }, [authLoading, user]);

  async function loadMatchesCount() {
    try {
      const apps = await getApplicationsForEmployer();
      setMatchesCount(apps.filter(a => a.status === 'accepted').length);
    } catch {}
  }

  async function loadProfile() {
    try {
      const stored = await getEmployerProfile(user!.id);

      if (stored) {
        setFirstName(stored.firstName || '');
        setLastName(stored.lastName || '');
        setCompany(stored.company || '');
        setPhone(stored.phone || '');
        setEmail(stored.email || user?.email || '');
        setStreet(stored.street || '');
        setHouseNumber(stored.houseNumber || '');
        setPostalCode(stored.postalCode || '');
        setCity(stored.city || '');
        setLat(stored.lat);
        setLon(stored.lon);
        setPaymentMethod(stored.paymentMethod || null);
        setShortBio(stored.shortBio || '');
      } else {
        setEmail(user?.email || '');
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim() || !street.trim() || !postalCode.trim() || !city.trim()) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Fehler', 'Bitte wähle eine Zahlungsart.');
      return;
    }

    setSaving(true);

    try {
      const payload: EmployerProfile = {
        userId: user!.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        street: street.trim(),
        houseNumber: houseNumber.trim() || undefined,
        postalCode: postalCode.trim(),
        city: city.trim(),
        lat,
        lon,
        paymentMethod,
        shortBio: shortBio.trim() || undefined
      };

      await saveEmployerProfile(user!.id, payload);

      router.replace('/(employer)/profile');
    }

    catch (e: any) {
      Alert.alert('Fehler', e?.message || 'Profil konnte nicht gespeichert werden');
    }

    finally {
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
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.neon} />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      
      {/* Neon Glow */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: 200,
          backgroundColor: COLORS.neon,
          opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.15] })
        }}
      />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>Mein Profil</Text>

          <Pressable onPress={handleLogout}>
            <Text style={{ color: COLORS.neon, fontWeight: '700' }}>Logout</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={{ padding: 20, gap: 20 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 60, height: 60, backgroundColor: COLORS.neon, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
                style={{ width: 42, height: 42 }}
              />
            </View>
          </View>

          {/* Matches Button */}
          <Pressable
            onPress={() => router.push('/(employer)/matches')}
            style={{
              backgroundColor: COLORS.neon,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
              {matchesCount > 0 ? `Neue Matches (${matchesCount})` : 'Meine Matches'}
            </Text>

            <View style={{ backgroundColor: COLORS.black, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: COLORS.neon, fontWeight: '900' }}>{matchesCount}</Text>
            </View>
          </Pressable>

          {/* FORM BLOCKS */}

          {/* PERSONAL DATA */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20 }}>

            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>PERSÖNLICHE DATEN</Text>

            {/* First Name */}
            <Field
              label="Vorname *"
              value={firstName}
              setValue={setFirstName}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              fieldKey="firstName"
            />

            {/* Last Name */}
            <Field
              label="Nachname *"
              value={lastName}
              setValue={setLastName}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              fieldKey="lastName"
            />

            <Field
              label="Firma (optional)"
              value={company}
              setValue={setCompany}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              fieldKey="company"
            />
          </View>

          {/* CONTACT */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>KONTAKT</Text>

            <Field
              label="Telefonnummer *"
              value={phone}
              setValue={setPhone}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              fieldKey="phone"
              keyboardType="phone-pad"
            />

            <Field
              label="E-Mail *"
              value={email}
              setValue={setEmail}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              fieldKey="email"
              keyboardType="email-address"
            />
          </View>

          {/* ADDRESS */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>RECHNUNGSADRESSE</Text>

            <AddressAutocompleteInput
              street={street}
              houseNumber={houseNumber}
              postalCode={postalCode}
              city={city}
              onStreetChange={setStreet}
              onHouseNumberChange={setHouseNumber}
              onPostalCodeChange={setPostalCode}
              onCityChange={setCity}
              onLatChange={setLat}
              onLonChange={setLon}
            />
          </View>

          {/* PAYMENT */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>ZAHLUNGSDATEN</Text>

            <PaymentOption label="Kreditkarte" value="card" selected={paymentMethod} setSelected={setPaymentMethod} />
            <PaymentOption label="PayPal" value="paypal" selected={paymentMethod} setSelected={setPaymentMethod} />
          </View>

          {/* ABOUT YOU */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>ÜBER DICH</Text>
            <TextInput
              value={shortBio}
              onChangeText={setShortBio}
              placeholder="Kurze Beschreibung..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              style={{
                fontSize: 15,
                color: COLORS.black,
                backgroundColor: '#F8F8F8',
                borderRadius: 12,
                padding: 16,
                minHeight: 100
              }}
            />
          </View>

          {/* SAVE BUTTON */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#DDD' : COLORS.neon,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>
              {saving ? 'Speichert...' : 'Profil speichern'}
            </Text>
          </Pressable>

          <View style={{ height: 60 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// SMALL INPUT FIELD COMPONENT
function Field({
  label,
  value,
  setValue,
  focusedField,
  setFocusedField,
  fieldKey,
  keyboardType
}: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.neon, marginBottom: 6 }}>
        {label}
      </Text>

      <View
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: focusedField === fieldKey ? COLORS.neon : 'transparent',
          paddingHorizontal: 16,
          paddingVertical: 12
        }}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          onFocus={() => setFocusedField(fieldKey)}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          style={{ fontSize: 16, color: COLORS.black }}
        />
      </View>
    </View>
  );
}

// PAYMENT OPTION CHIP
function PaymentOption({ label, value, selected, setSelected }) {
  return (
    <Pressable
      onPress={() => setSelected(value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: selected === value ? COLORS.neon : '#F8F8F8',
        marginBottom: 12
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: selected === value ? COLORS.black : COLORS.darkGray,
          backgroundColor: selected === value ? COLORS.black : 'transparent',
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {selected === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.neon }} />}
      </View>

      <Text style={{ fontSize: 16, fontWeight: selected === value ? '700' : '600', color: COLORS.black }}>
        {label}
      </Text>
    </Pressable>
  );
}
