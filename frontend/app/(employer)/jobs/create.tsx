// app/(employer)/jobs/create.tsx – PREMIUM PURPLE FINAL CLEAN VERSION
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Platform } from 'react-native';
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
  bg: '#3D2CE6',           // Premium Purple Background
  card: '#FFFFFF',         // White cards for clarity
  cardSoft: '#F5F5F5',
  border: 'rgba(0,0,0,0.06)',
  inputBorder: 'rgba(0,0,0,0.12)',
  inputBg: '#FFFFFF',
  white: '#000000',        // Black text inside white cards
  neon: '#C8FF16',
  purple: '#3D2CE6',
  muted: '#777777',
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

  // Kategorie-Optionen aus taxonomy.json
  const categoryOptions = Object.entries(taxonomy).map(([key, obj]: [string, any]) => ({
    value: key,
    label: obj.label,
  }));

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [address, setAddress] = useState<Address>({});
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);

  // NEW TAXONOMY
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [qualifications, setQualifications] = useState<string[]>([]);

  // Legacy tags (leer, nur für Backwards-Kompatibilität)
  const [requiredAll, setRequiredAll] = useState<string[]>([]);
  const [requiredAny, setRequiredAny] = useState<string[]>([]);

  // Time & Date
  const [date, setDate] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Payment
  const [workerAmountInput, setWorkerAmountInput] = useState('');
  const [workerAmountCents, setWorkerAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'paypal'>('cash');

  // Error & Loading
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Subcategories / qualifications für gewählte Kategorie
  const subcategoryOptions =
    category && (taxonomy as any)[category]
      ? (taxonomy as any)[category].subcategories || []
      : [];
  const qualificationOptions =
    category && (taxonomy as any)[category]
      ? (taxonomy as any)[category].qualifications || []
      : [];

  // Reset subcategory/qualifications wenn Kategorie wechselt
  useEffect(() => {
    setSubcategory(null);
    setQualifications([]);
    setRequiredAll([]);
    setRequiredAny([]);
  }, [category]);

  // Reset Form bei Focus (neuer Auftrag soll immer leer starten)
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

    if (!title.trim()) {
      setError('Gib einen Jobtitel ein.');
      return;
    }

    if (!category) {
      setError('Wähle eine Kategorie.');
      return;
    }

    if (!address.street && !address.postalCode && !address.city) {
      setError('Gib eine Adresse an.');
      return;
    }

    if (workerAmountCents <= 0) {
      setError('Gib einen gültigen Lohn ein.');
      return;
    }

    // Koordinaten sind Pflicht für Matching
    if (!lat || !lon) {
      setError(
        'Keine Koordinaten gefunden.\nNutze die Adresssuche und wähle einen Vorschlag aus.'
      );
      return;
    }

    if (!date) {
      setError('Gib ein Datum ein (YYYY-MM-DD).');
      return;
    }
    if (!startAt) {
      setError('Gib eine Startzeit ein (HH:MM).');
      return;
    }
    if (!endAt) {
      setError('Gib eine Endzeit ein (HH:MM).');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(date);
    if (jobDate < today) {
      setError('Das Datum liegt in der Vergangenheit.');
      return;
    }

    if (jobDate.getTime() === today.getTime()) {
      const now = new Date();
      const [endHour, endMin] = endAt.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);
      if (endTime < now) {
        setError('Die Endzeit liegt in der Vergangenheit.');
        return;
      }
    }

    const location: Address = {
      street: address.street?.trim() || undefined,
      houseNumber: address.houseNumber?.trim() || undefined,
      postalCode: address.postalCode?.trim() || undefined,
      city: address.city?.trim() || undefined,
    };

    const fullDescription = description.trim() || undefined;

    const jobCreate: JobCreate = {
      employerType: user.accountType === 'business' ? 'business' : 'private',
      title: title.trim(),
      description: fullDescription,
      category,
      subcategory: subcategory || undefined,
      qualifications,
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
      console.log('createJob error:', e);
      setError('Der Auftrag wurde nicht gespeichert.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
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
            fontSize: 26,
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
          Erstelle einen Job, damit Worker sich bewerben.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingBottom: 120,
          gap: SPACING.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
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
            placeholder="z. B. Fahrer für Event in Köln"
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
            Beschreibung (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Schreibe kurz, was zu tun ist."
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
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                marginBottom: SPACING.sm,
              }}
            >
              Wähle die Aufgabe, die zum Job passt.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {subcategoryOptions.map((sub: any) => (
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                marginBottom: SPACING.sm,
              }}
            >
              Worker sollen alle ausgewählten Qualifikationen haben.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {qualificationOptions.map((qual: any) => (
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
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
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
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

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 12,
              marginTop: 8,
            }}
          >
            Diese Zeiten sehen Worker im Angebot.
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
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 12,
              marginBottom: SPACING.sm,
            }}
          >
            Tippe die Adresse und wähle einen Vorschlag. So kann die App Worker in der Nähe finden.
          </Text>

          <AddressAutocompleteInput
            street={address.street || ''}
            houseNumber={address.houseNumber || ''}
            postalCode={address.postalCode}
            city={address.city}
            onStreetChange={value => {
              setAddress(prev => ({ ...prev, street: value }));
            }}
            onHouseNumberChange={value => {
              setAddress(prev => ({ ...prev, houseNumber: value }));
            }}
            onPostalCodeChange={value => {
              setAddress(prev => ({ ...prev, postalCode: value }));
            }}
            onCityChange={value => {
              setAddress(prev => ({ ...prev, city: value }));
            }}
            onLatChange={value => {
              setLat(value);
            }}
            onLonChange={value => {
              setLon(value);
            }}
          />
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
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            Das ist der Betrag, den du an den Worker zahlst.
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

        {/* Hinweis für private Auftraggeber */}
        {user?.accountType === 'private' && user?.isSelfEmployed === false && (
          <View
            style={{
              backgroundColor: COLORS.cardSoft,
              borderRadius: 14,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              Hinweis für private Auftraggeber
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              Für kurzfristige Jobs erstellt die App die nötigen Unterlagen. Du reichst sie bei
              Bedarf selbst bei der Minijob-Zentrale ein.
            </Text>
          </View>
        )}

        {/* Cost Breakdown */}
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

        {/* Zahlungsart an Worker */}
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
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Pressable
              onPress={() => setPaymentMethod('cash')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: paymentMethod === 'cash' ? COLORS.neon : COLORS.border,
                backgroundColor:
                  paymentMethod === 'cash' ? 'rgba(200,255,22,0.1)' : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                Bar
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('bank')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: paymentMethod === 'bank' ? COLORS.neon : COLORS.border,
                backgroundColor:
                  paymentMethod === 'bank' ? 'rgba(200,255,22,0.1)' : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                Überweisung
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('paypal')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: paymentMethod === 'paypal' ? COLORS.neon : COLORS.border,
                backgroundColor:
                  paymentMethod === 'paypal' ? 'rgba(200,255,22,0.1)' : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                PayPal
              </Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* FIXED ACTION BUTTON AREA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: SPACING.md,
          paddingBottom: Platform.OS === 'ios' ? 32 : 20,
          paddingTop: 12,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '60%', maxWidth: 400 }}>
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
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
