import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { CostBreakdown } from '../../../components/CostBreakdown';
import Chip from '../../../components/ui/Chip';
import { JobCreate } from '../../../types/job';
import { Address } from '../../../types/address';
import { addJob } from '../../../utils/jobStore';
import AddressAutocompleteInput from '../../../components/AddressAutocompleteInput';
import taxonomy from '../../../shared/taxonomy.json';

export default function CreateJob() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // Reset form when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset all form fields
      setTitle('');
      setDescription('');
      setCategory(null);
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
  
  // Kategorie-Optionen aus taxonomy.json
  const categoryOptions = Object.entries(taxonomy).map(([key, obj]: [string, any]) => ({
    value: key,
    label: obj.label
  }));

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [address, setAddress] = useState<Address>({});
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  
  // NEW TAXONOMY: subcategory + qualifications
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [qualifications, setQualifications] = useState<string[]>([]);
  
  // Legacy tags - kept for backward compatibility
  const [requiredAll, setRequiredAll] = useState<string[]>([]);
  const [requiredAny, setRequiredAny] = useState<string[]>([]);
  
  // Get subcategories and qualifications for selected category
  const subcategoryOptions = category && (taxonomy as any)[category] ? (taxonomy as any)[category].subcategories || [] : [];
  const qualificationOptions = category && (taxonomy as any)[category] ? (taxonomy as any)[category].qualifications || [] : [];

  // Reset subcategory and qualifications when category changes
  useEffect(() => {
    if (category) {
      setSubcategory(null);
      setQualifications([]);
      setRequiredAll([]);
      setRequiredAny([]);
    } else {
      setSubcategory(null);
      setQualifications([]);
      setRequiredAll([]);
      setRequiredAny([]);
    }
  }, [category]);

  // Time & Date fields
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

  const handleWorkerAmountChange = (text: string) => {
    setWorkerAmountInput(text);
    const normalized = text.replace(',', '.').trim();
    const num = parseFloat(normalized);
    setWorkerAmountCents(Number.isFinite(num) && num >= 0 ? Math.round(num * 100) : 0);
  };

  const handlePublish = async () => {
    setError(null);

    // User validation
    if (!user || user.role !== 'employer') {
      setError('Du musst als Auftraggeber angemeldet sein.');
      return;
    }

    // Basic validation
    if (!title.trim()) {
      setError('Bitte einen Jobtitel eingeben.');
      return;
    }

    if (!category) {
      setError('Bitte eine Kategorie auswählen.');
      return;
    }

    if (!address.street && !address.postalCode && !address.city) {
      setError('Bitte mindestens ein Adressfeld ausfüllen.');
      return;
    }

    if (workerAmountCents <= 0) {
      setError('Bitte eine gültige Vergütung eingeben.');
      return;
    }

    // KRITISCH: Koordinaten sind ZWINGEND für Matching!
    if (!lat || !lon) {
      setError('⚠️ KRITISCH: Keine GPS-Koordinaten gefunden!\n\nBitte verwende die Adresssuche oben und wähle einen Vorschlag aus der Liste.\n\nOder gib Straße, Hausnummer, PLZ und Stadt komplett ein und warte 2 Sekunden bis "Koordinaten werden berechnet..." erscheint.');
      return;
    }

    // Validate time fields
    if (!date) {
      setError('Bitte Datum eingeben (YYYY-MM-DD)');
      return;
    }
    if (!startAt) {
      setError('Bitte Startzeit eingeben (HH:MM)');
      return;
    }
    if (!endAt) {
      setError('Bitte Endzeit eingeben (HH:MM)');
      return;
    }

    // Validate date is not in past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(date);
    if (jobDate < today) {
      setError('Das Datum darf nicht in der Vergangenheit liegen');
      return;
    }

    // If date is today, check if end time is not in past
    if (jobDate.getTime() === today.getTime()) {
      const now = new Date();
      const [endHour, endMin] = endAt.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);
      if (endTime < now) {
        setError('Die Endzeit darf nicht in der Vergangenheit liegen');
        return;
      }
    }

    // Tags sind bereits Arrays (requiredAll, requiredAny)
    const requiredAllTags = requiredAll;
    const requiredAnyTags = requiredAny;

    // Build structured address
    const location: Address = {
      street: address.street?.trim() || undefined,
      houseNumber: address.houseNumber?.trim() || undefined,
      postalCode: address.postalCode?.trim() || undefined,
      city: address.city?.trim() || undefined,
    };

    // Build description (NO time appended)
    const fullDescription = description.trim() || undefined;

    // Create job object
    const jobCreate: JobCreate = {
      employerType: user.accountType === 'business' ? 'business' : 'private',
      title: title.trim(),
      description: fullDescription,
      category,
      timeMode: 'fixed_time',
      date,
      startAt,
      endAt,
      address: location,
      lat: lat,
      lon: lon,
      workerAmountCents,
      paymentToWorker: paymentMethod,
      required_all_tags: requiredAllTags,
      required_any_tags: requiredAnyTags,
    };

    try {
      setIsSaving(true);
      console.log('📝 createJob: Sending JobCreate', { title: jobCreate.title, category: jobCreate.category });
      await addJob(jobCreate);
      console.log('✅ createJob: Auftrag saved successfully');
      router.replace('/(employer)');
    } catch (e) {
      console.log('❌ createJob: Auftrag publish error:', e);
      setError('Auftrag konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
            Auftrag erstellen
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray500, marginTop: 4 }}>
            Erstelle ein neues Jobangebot für dein Team
          </Text>
        </View>

        {/* Title */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600', fontSize: 15 }}>Titel *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z.B. Lieferfahrer heute Abend"
            placeholderTextColor={colors.gray400}
            style={{
              borderWidth: 1.5,
              borderColor: colors.gray300,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: colors.white,
              color: colors.black,
              fontSize: 16,
              fontWeight: '500',
            }}
          />
        </View>

        {/* Description */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600', fontSize: 15 }}>Beschreibung (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Details zum Job..."
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1.5,
              borderColor: colors.gray300,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: colors.white,
              color: colors.black,
              minHeight: 100,
              textAlignVertical: 'top',
              fontSize: 15,
            }}
          />
        </View>

        {/* Category */}
        <View style={{ 
          gap: spacing.sm,
          backgroundColor: colors.white,
          padding: spacing.md,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.gray200,
        }}>
          <Text style={{ color: colors.black, fontWeight: '600', fontSize: 15 }}>Kategorie *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categoryOptions.map((cat) => (
              <Chip
                key={cat.value}
                label={cat.label}
                selected={category === cat.value}
                onPress={() => {
                  setCategory(cat.value);
                  // Tags werden automatisch per useEffect gesetzt
                }}
              />
            ))}
          </View>
        </View>

        {/* Tags - nur wenn Kategorie gewählt */}
        {category && (requiredTagOptions.length > 0 || optionalTagOptions.length > 0) && (
          <View style={{ 
            borderWidth: 1, 
            borderColor: colors.gray200, 
            borderRadius: 12, 
            padding: spacing.md, 
            gap: 12,
            backgroundColor: colors.white 
          }}>
            <Text style={{ color: colors.black, fontWeight: '600' }}>
              Anforderungen
            </Text>
            <Text style={{ color: colors.gray600, fontSize: 13 }}>
              Wähle Pflicht- und optionale Qualifikationen für diesen Job.
            </Text>
            
            {/* Required Tags (MUST ALL) */}
            {requiredTagOptions.length > 0 && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 14 }}>
                    Pflichtqualifikationen (empfohlen)
                  </Text>
                  <View style={{ 
                    backgroundColor: colors.purple, 
                    paddingHorizontal: 6, 
                    paddingVertical: 2, 
                    borderRadius: 4 
                  }}>
                    <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>
                      MUSS ALLE HABEN
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.gray500, fontSize: 12 }}>
                  Worker müssen alle diese Qualifikationen haben
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {requiredTagOptions.map((tag: any) => (
                    <Chip
                      key={tag.value}
                      label={tag.label}
                      selected={requiredAll.includes(tag.value)}
                      onPress={() => {
                        if (requiredAll.includes(tag.value)) {
                          setRequiredAll(requiredAll.filter(t => t !== tag.value));
                        } else {
                          setRequiredAll([...requiredAll, tag.value]);
                        }
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Optional Tags (ANY) */}
            {optionalTagOptions.length > 0 && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 14 }}>
                    Zusatzqualifikationen (optional)
                  </Text>
                  <View style={{ 
                    backgroundColor: colors.gray400, 
                    paddingHorizontal: 6, 
                    paddingVertical: 2, 
                    borderRadius: 4 
                  }}>
                    <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>
                      MINDESTENS EINE
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.gray500, fontSize: 12 }}>
                  Worker müssen mindestens eine dieser Qualifikationen haben
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {optionalTagOptions.map((tag: any) => (
                    <Chip
                      key={tag.value}
                      label={tag.label}
                      selected={requiredAny.includes(tag.value)}
                      onPress={() => {
                        if (requiredAny.includes(tag.value)) {
                          setRequiredAny(requiredAny.filter(t => t !== tag.value));
                        } else {
                          setRequiredAny([...requiredAny, tag.value]);
                        }
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Zeit & Datum */}
        <View style={{ 
          borderWidth: 1, 
          borderColor: colors.gray200, 
          borderRadius: 12, 
          padding: spacing.md, 
          gap: 12,
          backgroundColor: colors.white 
        }}>
          <Text style={{ color: colors.black, fontWeight: '600', fontSize: 15 }}>
            Wann findet der Job statt? *
          </Text>
          
          {/* Datum */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 14 }}>
              Datum
            </Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  border: '1.5px solid #ccc',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: '#fff',
                  color: '#000',
                }}
              />
            ) : (
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                style={{
                  borderWidth: 1.5,
                  borderColor: '#ccc',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: '#fff',
                  color: '#000',
                }}
              />
            )}
          </View>

          {/* Startzeit */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 14 }}>
              Startzeit
            </Text>
            <TextInput
              value={startAt}
              onChangeText={setStartAt}
              placeholder="HH:MM"
              keyboardType="numeric"
              placeholderTextColor={colors.gray400}
              style={{
                borderWidth: 1.5,
                borderColor: colors.gray300,
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.white,
                color: colors.black,
                fontSize: 15,
              }}
            />
          </View>

          {/* Endzeit */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 14 }}>
              Endzeit
            </Text>
            <TextInput
              value={endAt}
              onChangeText={setEndAt}
              placeholder="HH:MM"
              keyboardType="numeric"
              placeholderTextColor={colors.gray400}
              style={{
                borderWidth: 1.5,
                borderColor: colors.gray300,
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.white,
                color: colors.black,
                fontSize: 15,
              }}
            />
          </View>

          <Text style={{ fontSize: 12, color: colors.gray500 }}>
            Diese Angaben sehen Worker im Jobangebot
          </Text>
        </View>

        {/* Address */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Adresse</Text>
          <Text style={{ color: colors.gray600, fontSize: 13 }}>
            Tippe mindestens 3 Buchstaben für Vorschläge.
          </Text>
          
          <AddressAutocompleteInput
            street={address.street || ''}
            houseNumber={address.houseNumber || ''}
            postalCode={address.postalCode}
            city={address.city}
            onStreetChange={(value) => {
              console.log('🏠 Street changed:', value);
              setAddress(prev => ({ ...prev, street: value }));
            }}
            onHouseNumberChange={(value) => {
              console.log('🏠 House number changed:', value);
              setAddress(prev => ({ ...prev, houseNumber: value }));
            }}
            onPostalCodeChange={(value) => {
              console.log('📮 PostalCode changed:', value);
              setAddress(prev => ({ ...prev, postalCode: value }));
            }}
            onCityChange={(value) => {
              console.log('🏙️ City changed:', value);
              setAddress(prev => ({ ...prev, city: value }));
            }}
            onLatChange={(value) => {
              console.log('📍 Lat changed:', value);
              setLat(value);
            }}
            onLonChange={(value) => {
              console.log('📍 Lon changed:', value);
              setLon(value);
            }}
          />
        </View>

        {/* Worker Amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>
            Gesamtlohn für Aufträgetarter (€)
          </Text>
          <TextInput
            value={workerAmountInput}
            onChangeText={handleWorkerAmountChange}
            placeholder="100"
            placeholderTextColor={colors.gray400}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.white,
              color: colors.black
            }}
          />
        </View>

        {/* Cost Breakdown */}
        {workerAmountCents > 0 && (
          <View style={{
            padding: spacing.md,
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}>
            <CostBreakdown workerAmountCents={workerAmountCents} />
          </View>
        )}

        {/* Payment Method */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Zahlung an Aufträgetarter</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setPaymentMethod('cash')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: paymentMethod === 'cash' ? colors.black : colors.gray200,
                backgroundColor: paymentMethod === 'cash' ? colors.black : colors.beige100,
              }}
            >
              <Text style={{ 
                color: paymentMethod === 'cash' ? colors.white : colors.black,
                textAlign: 'center',
                fontWeight: '600'
              }}>
                Bar
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('bank')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: paymentMethod === 'bank' ? colors.black : colors.gray200,
                backgroundColor: paymentMethod === 'bank' ? colors.black : colors.beige100,
              }}
            >
              <Text style={{ 
                color: paymentMethod === 'bank' ? colors.white : colors.black,
                textAlign: 'center',
                fontWeight: '600'
              }}>
                Überweisung
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('paypal')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: paymentMethod === 'paypal' ? colors.black : colors.gray200,
                backgroundColor: paymentMethod === 'paypal' ? colors.black : colors.beige100,
              }}
            >
              <Text style={{ 
                color: paymentMethod === 'paypal' ? colors.white : colors.black,
                textAlign: 'center',
                fontWeight: '600'
              }}>
                PayPal
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title={isSaving ? 'Veröffentliche…' : 'Auftrag veröffentlichen'}
          onPress={handlePublish}
          disabled={isSaving}
        />

        {error && (
          <Text style={{ color: 'red', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}