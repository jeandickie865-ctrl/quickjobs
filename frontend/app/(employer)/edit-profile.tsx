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
import { Ionicons } from '@expo/vector-icons';
import { getApplicationsForEmployer } from '../../utils/applicationStore';
import AddressAutocompleteInput from '../../components/AddressAutocompleteInput';
import { AppHeader } from '../../../../components/AppHeader';

// BACKUP DARK THEME
const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  white: '#1A1A1A',
  cardText: "#00A07C",
  text: '#1A1A1A',
  muted: 'rgba(0,0,0,0.6)',
  neon: '#EFABFF',
  black: '#000000',
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [shortBio, setShortBio] = useState('');

  // Focus for neon border
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

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

      // Show success toast
      setShowToast(true);
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Navigate immediately after save
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowToast(false);
          setSaving(false);
          router.replace('/(employer)/profile');
        });
      }, 1200);
    }

    catch (e: any) {
      console.error('❌ Employer Profile Save Error:', e);
      Alert.alert('Fehler', e?.message || 'Profil konnte nicht gespeichert werden');
    }

    finally {
      // Only reset saving state if there was an error (success handled in timeout)
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
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.neon} />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>Mein Profil</Text>

          <Pressable onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.neon} />
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
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
              {matchesCount > 0 ? `Neue Matches (${matchesCount})` : 'Meine Matches'}
            </Text>

            <View style={{ backgroundColor: COLORS.neon, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: COLORS.black, fontWeight: '900' }}>{matchesCount}</Text>
            </View>
          </Pressable>

          {/* FORM BLOCKS */}

          {/* PERSONAL DATA */}
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border }}>

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
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border }}>
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
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border }}>
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
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>ZAHLUNGSDATEN</Text>

            <PaymentOption label="Kreditkarte" value="card" selected={paymentMethod} setSelected={setPaymentMethod} />
            <PaymentOption label="PayPal" value="paypal" selected={paymentMethod} setSelected={setPaymentMethod} />
          </View>

          {/* ABOUT YOU */}
          <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ color: COLORS.neon, fontWeight: '700', marginBottom: 14 }}>ÜBER DICH</Text>
            <TextInput
              value={shortBio}
              onChangeText={setShortBio}
              placeholder="Kurze Beschreibung..."
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 15,
                color: COLORS.white,
                backgroundColor: COLORS.bg,
                borderRadius: 12,
                padding: 16,
                minHeight: 100
              }}
            />
          </View>

          {/* Spacer for fixed button */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>

        {/* FIXED SAVE BUTTON */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 999,
          paddingHorizontal: 20,
        }}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? COLORS.muted : COLORS.neon,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              shadowColor: COLORS.neon,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>
              {saving ? 'Speichert...' : 'Profil speichern'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Success Toast */}
      {showToast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 60,
            left: 20,
            right: 20,
            backgroundColor: COLORS.neon,
            borderRadius: 12,
            padding: 16,
            opacity: toastOpacity,
            zIndex: 9999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            ✅ Profil erfolgreich gespeichert!
          </Text>
        </Animated.View>
      )}
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
  const focused = focusedField === fieldKey;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: focused ? COLORS.neon : COLORS.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
        style={{
          backgroundColor: COLORS.bg,
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
          color: COLORS.white,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? COLORS.neon : COLORS.border,
        }}
        placeholderTextColor={COLORS.muted}
      />
    </View>
  );
}

// PAYMENT OPTION CHIP
function PaymentOption({ label, value, selected, setSelected }: any) {
  const isSelected = selected === value;
  return (
    <Pressable
      onPress={() => setSelected(value)}
      style={{
        backgroundColor: isSelected ? COLORS.neon : COLORS.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? COLORS.neon : COLORS.border,
      }}
    >
      <Text style={{ fontWeight: '700', color: isSelected ? COLORS.black : COLORS.white, fontSize: 15 }}>
        {label}
      </Text>
    </Pressable>
  );
}
