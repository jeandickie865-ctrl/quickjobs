import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { CostBreakdown } from '../../../components/CostBreakdown';
import Chip from '../../../components/ui/Chip';
import { listCategories, CategoryKey, groupTagsByType } from '../../../src/taxonomy';
import { JobTimeMode, Job } from '../../../types/job';
import { Address } from '../../../types/address';
import { addJob } from '../../../utils/jobStore';
import { parseGermanDateTime } from '../../../utils/date';
import { AddressAutocompleteInput } from '../../../components/AddressAutocompleteInput';

export default function CreateJob() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const categories = listCategories();

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [address, setAddress] = useState<Address>({});
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  
  // Tags (using Sets for easier management)
  const [requiredAllSet, setRequiredAllSet] = useState<Set<string>>(new Set());
  const [requiredAnySet, setRequiredAnySet] = useState<Set<string>>(new Set());

  // Time mode
  const [timeMode, setTimeMode] = useState<JobTimeMode>('fixed_time');
  
  // fixed_time (deutsches Format TT.MM.JJJJ)
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // hour_package
  const [hours, setHours] = useState('');
  
  // project (deutsches Format TT.MM.JJJJ)
  const [dueDate, setDueDate] = useState('');

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

    // Time mode validation & parsing
    let startAtIso: string | undefined;
    let endAtIso: string | undefined;
    let hoursNumber: number | undefined;
    let dueAtIso: string | undefined;

    if (timeMode === 'fixed_time') {
      if (!date.trim() || !startTime.trim() || !endTime.trim()) {
        setError('Bitte Datum und Zeiten ausfüllen (Format: TT.MM.JJJJ und HH:MM)');
        return;
      }

      startAtIso = parseGermanDateTime(date, startTime);
      endAtIso = parseGermanDateTime(date, endTime);

      if (!startAtIso || !endAtIso) {
        setError('Ungültiges Datum oder Zeitformat. Bitte TT.MM.JJJJ und HH:MM verwenden.');
        return;
      }

      if (new Date(endAtIso) <= new Date(startAtIso)) {
        setError('Endzeit muss nach Startzeit liegen.');
        return;
      }
    } else if (timeMode === 'hour_package') {
      const h = parseFloat(hours);
      if (!hours || isNaN(h) || h <= 0) {
        setError('Bitte gültige Stundenanzahl eingeben.');
        return;
      }
      hoursNumber = h;
    } else if (timeMode === 'project') {
      if (dueDate.trim()) {
        dueAtIso = parseGermanDateTime(dueDate, '23:59');
        if (!dueAtIso) {
          setError('Ungültiges Fälligkeitsdatum. Bitte TT.MM.JJJJ verwenden.');
          return;
        }
      }
    }

    // Convert Sets to Arrays
    const requiredAllTags = Array.from(requiredAllSet);
    const requiredAnyTags = Array.from(requiredAnySet);

    // Build structured address
    const location: Address = {
      street: address.street?.trim() || undefined,
      postalCode: address.postalCode?.trim() || undefined,
      city: address.city?.trim() || undefined,
    };

    // Create job object
    const job: Auftrag = {
      id: 'job-' + Date.now().toString(),
      employerId: user.id,
      employerType: user.accountType === 'business' ? 'business' : 'private',
      title: title.trim(),
      description: description.trim() || '',
      category,
      timeMode,
      startAt: startAtIso,
      endAt: endAtIso,
      hours: hoursNumber,
      dueAt: dueAtIso,
      address: location,  // Strukturierte Adresse statt String
      lat: lat,  // Koordinaten aus Geocoder (falls vorhanden)
      lon: lon,  // Koordinaten aus Geocoder (falls vorhanden)
      workerAmountCents,
      paymentToWorker: paymentMethod,
      required_all_tags: requiredAllTags,
      required_any_tags: requiredAnyTags,
      status: 'open',
      matchedWorkerId: undefined,  // Set when application is accepted
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      console.log('📝 createJob: newJob', { id: job.id, title: job.title, employerId: job.employerId });
      await addJob(job);
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
            {categories.map(cat => (
              <Chip
                key={cat.key}
                label={cat.title}
                selected={category === cat.key}
                onPress={() => {
                  setCategory(cat.key);
                  // Reset tags when category changes
                  setRequiredAllSet(new Set());
                  setRequiredAnySet(new Set());
                }}
              />
            ))}
          </View>
        </View>

        {/* Tags - nur wenn Kategorie gewählt */}
        {category && (() => {
          const groups = groupTagsByType(category as CategoryKey);
          
          const allTags = [
            ...groups.activities,
            ...groups.qualifications,
          ];
          
          if (allTags.length === 0) return null;
          
          return (
            <View style={{ 
              borderWidth: 1, 
              borderColor: colors.gray200, 
              borderRadius: 12, 
              padding: spacing.md, 
              gap: 12,
              backgroundColor: colors.white 
            }}>
              <Text style={{ color: colors.black, fontWeight: '600' }}>
                Anforderungen (optional)
              </Text>
              <Text style={{ color: colors.gray600, fontSize: 13 }}>
                Wähle Tätigkeiten und Qualifikationen, die für diesen Auftrag wichtig sind. Für einfache Hilfstätigkeiten kannst du dies leer lassen.
              </Text>
              
              {/* Tätigkeiten */}
              {groups.activities.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 12 }}>
                    Tätigkeiten (optional)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {groups.activities.sort((a, b) => a.localeCompare(b)).map(tagKey => (
                      <Chip
                        key={tagKey}
                        label={tagKey}
                        selected={requiredAllSet.has(tagKey)}
                        onPress={() => {
                          const nextAll = new Set(requiredAllSet);
                          if (nextAll.has(tagKey)) {
                            nextAll.delete(tagKey);
                          } else {
                            nextAll.add(tagKey);
                          }
                          setRequiredAllSet(nextAll);
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Qualifikationen */}
              {groups.qualifications.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 12 }}>
                    Qualifikationen (optional)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {groups.qualifications.sort((a, b) => a.localeCompare(b)).map(tagKey => (
                      <Chip
                        key={tagKey}
                        label={tagKey}
                        selected={requiredAllSet.has(tagKey)}
                        onPress={() => {
                          const nextAll = new Set(requiredAllSet);
                          if (nextAll.has(tagKey)) {
                            nextAll.delete(tagKey);
                          } else {
                            nextAll.add(tagKey);
                          }
                          setRequiredAllSet(nextAll);
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })()}

        {/* Time Mode */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Zeitart</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setTimeMode('fixed_time')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: timeMode === 'fixed_time' ? colors.black : colors.gray200,
                backgroundColor: timeMode === 'fixed_time' ? colors.black : colors.beige100,
              }}
            >
              <Text style={{ 
                color: timeMode === 'fixed_time' ? colors.white : colors.black,
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 12
              }}>
                Zeitgenau
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTimeMode('hour_package')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: timeMode === 'hour_package' ? colors.black : colors.gray200,
                backgroundColor: timeMode === 'hour_package' ? colors.black : colors.beige100,
              }}
            >
              <Text style={{ 
                color: timeMode === 'hour_package' ? colors.white : colors.black,
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 12
              }}>
                Stundenpaket
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTimeMode('project')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: timeMode === 'project' ? colors.black : colors.gray200,
                backgroundColor: timeMode === 'project' ? colors.black : colors.beige100,
              }}
            >
              <Text style={{ 
                color: timeMode === 'project' ? colors.white : colors.black,
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 12
              }}>
                Projekt
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Time inputs based on mode */}
        {timeMode === 'fixed_time' && (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.black, fontWeight: '600' }}>Datum</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="TT.MM.JJJJ"
                placeholderTextColor={colors.gray400}
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: colors.black, fontWeight: '600' }}>Von</Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="19:00"
                  placeholderTextColor={colors.gray400}
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
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: colors.black, fontWeight: '600' }}>Bis</Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="23:00"
                  placeholderTextColor={colors.gray400}
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
            </View>
          </View>
        )}

        {timeMode === 'hour_package' && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.black, fontWeight: '600' }}>Stundenanzahl</Text>
            <TextInput
              value={hours}
              onChangeText={setHours}
              placeholder="z.B. 6"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
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
        )}

        {timeMode === 'project' && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.black, fontWeight: '600' }}>Fällig bis (optional)</Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="TT.MM.JJJJ"
              placeholderTextColor={colors.gray400}
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
        )}

        {/* Address */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Adresse</Text>
          <Text style={{ color: colors.gray600, fontSize: 13 }}>
            Tippe mindestens 3 Buchstaben für Vorschläge.
          </Text>
          
          <AddressAutocompleteInput
            street={address.street || ''}
            postalCode={address.postalCode}
            city={address.city}
            onStreetChange={(value) => setAddress({ ...address, street: value })}
            onPostalCodeChange={(value) => setAddress({ ...address, postalCode: value })}
            onCityChange={(value) => setAddress({ ...address, city: value })}
            onLatChange={(value) => setLat(value)}
            onLonChange={(value) => setLon(value)}
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