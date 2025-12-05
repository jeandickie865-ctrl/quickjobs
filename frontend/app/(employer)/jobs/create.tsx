// app/(employer)/jobs/create.tsx – BACKUP DARK DESIGN
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { CostBreakdown } from '../../../components/CostBreakdown';
import Chip from '../../../components/ui/Chip';
import { JobCreate } from '../../../types/job';
import { Address } from '../../../types/address';
import { addJob } from '../../../utils/jobStore';
import AddressAutocompleteInput from '../../../components/AddressAutocompleteInput';
import taxonomy from '../../../shared/taxonomy.json';

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  cardSoft: '#181433',
  border: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.15)',
  inputBg: '#1E1938',
  white: '#FFFFFF',
  neon: '#C8FF16',
  purple: '#6B4BFF',
  muted: 'rgba(255,255,255,0.6)',
  error: '#FF4D4D',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function CreateJob() {
  const { user } = useAuth();
  const router = useRouter();

  const categoryOptions = Object.entries(taxonomy).map(([key, obj]) => ({
    value: key,
    label: obj.label,
  }));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const [address, setAddress] = useState<Address>({});
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);

  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [qualifications, setQualifications] = useState<string[]>([]);

  const [requiredAll, setRequiredAll] = useState<string[]>([]);
  const [requiredAny, setRequiredAny] = useState<string[]>([]);

  const [date, setDate] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const [workerAmountInput, setWorkerAmountInput] = useState('');
  const [workerAmountCents, setWorkerAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'paypal'>('cash');

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const subcategoryOptions =
    category && taxonomy[category]
      ? taxonomy[category].subcategories || []
      : [];

  const qualificationOptions =
    category && taxonomy[category]
      ? taxonomy[category].qualifications || []
      : [];

  useEffect(() => {
    setSubcategory(null);
    setQualifications([]);
    setRequiredAll([]);
    setRequiredAny([]);
  }, [category]);

  useFocusEffect(
    React.useCallback(() => {
      setTitle('');
      setDescription('');
      setCategory(null);
      setSubcategory(null);
      setQualifications([]);
      setAddress({});
      setLat(undefined);
      setLon(undefined);
      setRequiredAll([]);
      setRequiredAny([]);
      setDate('');
      setStartAt('');
      setEndAt('');
      setWorkerAmountInput('');
      setWorkerAmountCents(0);
      setPaymentMethod('cash');
      setError(null);
    }, [])
  );

  const handleWorkerAmountChange = (text: string) => {
    setWorkerAmountInput(text);
    const normalized = text.replace(',', '.').trim();
    const num = parseFloat(normalized);
    setWorkerAmountCents(Number.isFinite(num) && num >= 0 ? Math.round(num * 100) : 0);
  };

  const handlePublish = async () => {
    setError(null);

    if (!user || user.role !== 'employer') {
      setError('Du musst als Auftraggeber angemeldet sein.');
      return;
    }
    // Pflichtfelder prüfen
    if (!title.trim()) {
      setError('Bitte gib einen Jobtitel ein.');
      return;
    }

    if (!category) {
      setError('Bitte wähle eine Kategorie.');
      return;
    }

    if (!subcategory) {
      setError('Bitte wähle eine Tätigkeit (Subkategorie).');
      return;
    }

    if (!workerAmountInput.trim() || workerAmountCents <= 0) {
      setError('Bitte gib einen gültigen Lohn ein.');
      return;
    }

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      setError('Bitte gib eine gültige Adresse ein oder nutze GPS.');
      return;
    }

    if (!date) {
      setError('Bitte gib ein Datum ein.');
      return;
    }

    if (!startAt) {
      setError('Bitte gib eine Startzeit ein.');
      return;
    }

    if (!endAt) {
      setError('Bitte gib eine Endzeit ein.');
      return;
    }

    // Datum darf nicht in der Vergangenheit liegen
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(date);
    if (jobDate < today) {
      setError('Datum liegt in der Vergangenheit.');
      return;
    }

    const location: Address = {
      street: address.street?.trim(),
      houseNumber: address.houseNumber?.trim(),
      postalCode: address.postalCode?.trim(),
      city: address.city?.trim(),
    };

    const fullDescription = description.trim() || undefined;

    const jobCreate: JobCreate = {
      employerType: user.accountType === 'business' ? 'business' : 'private',
      title: title.trim(),
      description: fullDescription,
      category: category || undefined,
      subcategory: subcategory || undefined,
      qualifications: qualifications || [],
      timeMode: 'fixed_time',
      date,
      startAt,
      endAt,
      address: location,
      lat,
      lon,
      workerAmountCents,
      paymentToWorker: paymentMethod,
      required_all_tags: [],
      required_any_tags: [],
    };

    try {
      setIsSaving(true);
      await addJob(jobCreate);
      router.replace('/(employer)');
    } catch (e) {
      setError('Der Auftrag wurde nicht gespeichert.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
        
        {/* HEADER */}
        <View
          style={{
            paddingHorizontal: SPACING.md,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.sm,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontSize: 28,
              fontWeight: '900',
            }}
          >
            Neuer Auftrag
          </Text>
          <Text
            style={{
              color: COLORS.muted,
              marginTop: 4,
              fontSize: 14,
            }}
          >
            Erstelle einen Job für Worker.
          </Text>
        </View>

        {/* SCROLL CONTENT */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: SPACING.md,
            paddingBottom: 100,
            gap: SPACING.lg,
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >

        {/* === GRUNDINFO === */}
        <View style={{ marginTop: SPACING.sm }}>
          <Text style={{ color: COLORS.neon, fontSize: 13, fontWeight: '700', marginBottom: SPACING.sm, letterSpacing: 1 }}>
            GRUNDINFO
          </Text>
        </View>

        {/* Titel */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: SPACING.sm,
              fontSize: 15,
            }}
          >
            Titel*
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z. B. Fahrer für Event"
            placeholderTextColor={COLORS.muted}
            style={{
              borderWidth: 1,
              borderColor: COLORS.inputBorder,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: COLORS.inputBg,
              color: COLORS.white,
              fontSize: 15,
            }}
          />
        </View>

        {/* Beschreibung */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: SPACING.sm,
              fontSize: 15,
            }}
          >
            Beschreibung
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Was ist zu tun?"
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: COLORS.inputBorder,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              minHeight: 100,
              backgroundColor: COLORS.inputBg,
              color: COLORS.white,
              fontSize: 14,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Kategorie */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: SPACING.sm,
              fontSize: 15,
            }}
          >
            Kategorie*
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categoryOptions.map(cat => (
              <Chip
                key={cat.value}
                label={cat.label}
                selected={category === cat.value}
                onPress={() => setCategory(cat.value)}
              />
            ))}
          </View>
        </View>

        {/* Subcategory */}
        {category && subcategoryOptions.length > 0 && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontWeight: '600',
                marginBottom: 6,
              }}
            >
              Tätigkeit*
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {subcategoryOptions.map(sub => (
                <Chip
                  key={sub.key}
                  label={sub.label}
                  selected={subcategory === sub.key}
                  onPress={() => setSubcategory(sub.key)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Qualifikationen */}
        {category && qualificationOptions.length > 0 && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontWeight: '600',
                marginBottom: 6,
              }}
            >
              Qualifikationen (optional)
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {qualificationOptions.map(qual => (
                <Chip
                  key={qual.key}
                  label={qual.label}
                  selected={qualifications.includes(qual.key)}
                  onPress={() => {
                    if (qualifications.includes(qual.key)) {
                      setQualifications(qualifications.filter(q => q !== qual.key));
                    } else {
                      setQualifications([...qualifications, qual.key]);
                    }
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Datum / Zeit */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: SPACING.sm,
              fontSize: 15,
            }}
          >
            Wann findet der Job statt?
          </Text>

          {/* Datum */}
          <View style={{ marginBottom: SPACING.sm }}>
            <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 4 }}>
              Datum (YYYY-MM-DD)
            </Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%',
                  border: `1px solid ${COLORS.inputBorder}`,
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 14,
                  backgroundColor: COLORS.inputBg,
                  color: COLORS.white,
                  outline: 'none',
                }}
              />
            ) : (
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.muted}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: COLORS.inputBg,
                  color: COLORS.white,
                  fontSize: 14,
                }}
              />
            )}
          </View>

          {/* Startzeit */}
          <View style={{ marginBottom: SPACING.sm }}>
            <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 4 }}>
              Startzeit (HH:MM)
            </Text>
            <TextInput
              value={startAt}
              onChangeText={setStartAt}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: COLORS.inputBg,
                color: COLORS.white,
                fontSize: 14,
              }}
            />
          </View>

          {/* Endzeit */}
          <View>
            <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 4 }}>
              Endzeit (HH:MM)
            </Text>
            <TextInput
              value={endAt}
              onChangeText={setEndAt}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: COLORS.inputBg,
                color: COLORS.white,
                fontSize: 14,
              }}
            />
          </View>
        </View>

        {/* === ORT & ZEIT === */}
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.neon, fontSize: 13, fontWeight: '700', marginBottom: SPACING.sm, letterSpacing: 1 }}>
            ORT & ZEIT
          </Text>
        </View>

        {/* Adresse */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: 4,
              fontSize: 15,
            }}
          >
            Adresse
          </Text>

          <AddressAutocompleteInput
            street={address.street || ''}
            postalCode={address.postalCode || ''}
            city={address.city || ''}
            houseNumber={address.houseNumber || ''}
            onStreetChange={(v) => setAddress(a => ({ ...a, street: v }))}
            onPostalCodeChange={(v) => setAddress(a => ({ ...a, postalCode: v }))}
            onCityChange={(v) => setAddress(a => ({ ...a, city: v }))}
            onHouseNumberChange={(v) => setAddress(a => ({ ...a, houseNumber: v }))}
            onLatChange={setLat}
            onLonChange={setLon}
          />
        </View>

        {/* === BEZAHLUNG === */}
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.neon, fontSize: 13, fontWeight: '700', marginBottom: SPACING.sm, letterSpacing: 1 }}>
            BEZAHLUNG
          </Text>
        </View>

        {/* Lohn */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Gesamtlohn für Worker (€)
          </Text>
          <TextInput
            value={workerAmountInput}
            onChangeText={handleWorkerAmountChange}
            placeholder="100"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: COLORS.inputBorder,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: COLORS.inputBg,
              color: COLORS.white,
              fontSize: 15,
            }}
          />
        </View>

        {workerAmountCents > 0 && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <CostBreakdown workerAmountCents={workerAmountCents} />
          </View>
        )}

        {/* Zahlungsmethode */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontWeight: '600',
              marginBottom: SPACING.sm,
            }}
          >
            Wie zahlst du den Worker?
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['cash', 'bank', 'paypal'].map(method => (
              <Pressable
                key={method}
                onPress={() => setPaymentMethod(method as any)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: paymentMethod === method ? COLORS.neon : COLORS.border,
                  backgroundColor:
                    paymentMethod === method ? 'rgba(200,255,22,0.1)' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
                  {method === 'cash' ? 'Bar' : method === 'bank' ? 'Überweisung' : 'PayPal'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* FIXED BOTTOM BUTTON */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: Platform.OS === 'ios' ? 34 : 18,
          paddingTop: 16,
          paddingHorizontal: SPACING.md,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          alignItems: 'center',
          zIndex: 999,
        }}
      >
        <View style={{ width: '100%', maxWidth: 360 }}>
          <Button
            title={isSaving ? 'Veröffentliche…' : 'Auftrag veröffentlichen'}
            onPress={handlePublish}
            disabled={isSaving}
          />
        </View>

        {error && (
          <Text
            style={{
              color: COLORS.error,
              fontSize: 13,
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}
