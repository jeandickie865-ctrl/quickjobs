import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { CostBreakdown } from '../../../components/CostBreakdown';
import Chip from '../../../components/ui/Chip';
import { listCategories, CategoryKey } from '../../../src/taxonomy';
import { JobTimeMode } from '../../../types/job';
import { saveJob } from '../../../utils/jobStore';

export default function CreateJob() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const categories = listCategories();

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [address, setAddress] = useState('');

  // Time mode
  const [timeMode, setTimeMode] = useState<JobTimeMode>('fixed_time');
  
  // fixed_time
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // hour_package
  const [hours, setHours] = useState('');
  
  // project
  const [dueDate, setDueDate] = useState('');

  // Payment
  const [workerAmountInput, setWorkerAmountInput] = useState('');
  const [workerAmountCents, setWorkerAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'paypal'>('cash');

  const handleWorkerAmountChange = (text: string) => {
    setWorkerAmountInput(text);
    const cleaned = text.replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      setWorkerAmountCents(Math.round(parsed * 100));
    } else {
      setWorkerAmountCents(0);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte Titel eingeben');
      return;
    }
    if (!category) {
      Alert.alert('Fehler', 'Bitte Kategorie wählen');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Fehler', 'Bitte Adresse eingeben');
      return;
    }
    if (workerAmountCents <= 0) {
      Alert.alert('Fehler', 'Bitte gültige Vergütung eingeben');
      return;
    }

    // Time mode validation
    if (timeMode === 'fixed_time') {
      if (!startDate || !startTime || !endTime) {
        Alert.alert('Fehler', 'Bitte Datum und Zeiten ausfüllen');
        return;
      }
    } else if (timeMode === 'hour_package') {
      const h = parseFloat(hours);
      if (!hours || isNaN(h) || h <= 0) {
        Alert.alert('Fehler', 'Bitte gültige Stundenanzahl eingeben');
        return;
      }
    }

    // Create job object
    const job = {
      id: 'job-' + Date.now(),
      employerId: user?.id || '',
      employerType: (user?.accountType || 'private') as 'private' | 'business',
      title,
      description,
      category,
      timeMode,
      startAt: timeMode === 'fixed_time' ? `${startDate}T${startTime}:00` : undefined,
      endAt: timeMode === 'fixed_time' ? `${startDate}T${endTime}:00` : undefined,
      hours: timeMode === 'hour_package' ? parseFloat(hours) : undefined,
      dueAt: timeMode === 'project' && dueDate ? `${dueDate}T23:59:59` : undefined,
      address,
      lat: 51.2277, // Demo: Düsseldorf Eller
      lon: 6.7735,
      workerAmountCents,
      paymentToWorker: paymentMethod,
      required_all_tags: [],
      required_any_tags: [],
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveJob(job);
      console.log('Job created:', job);
      Alert.alert('Erfolg', 'Job wurde erstellt!', [
        { text: 'OK', onPress: () => router.push('/(employer)') }
      ]);
    } catch (error) {
      Alert.alert('Fehler', 'Job konnte nicht gespeichert werden');
      console.error('Error saving job:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        <Text style={{ color: colors.black, fontSize: 22, fontWeight: '800' }}>
          Job erstellen
        </Text>

        {/* Title */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Titel</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z.B. Lieferfahrer heute Abend"
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

        {/* Description */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Beschreibung (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Details zum Job..."
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.white,
              color: colors.black,
              minHeight: 80,
              textAlignVertical: 'top'
            }}
          />
        </View>

        {/* Category */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>Kategorie</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={category === cat.key}
                onPress={() => setCategory(cat.key)}
              />
            ))}
          </View>
        </View>

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
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2024-12-20"
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
              placeholder="2024-12-31"
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
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Straße, PLZ, Ort"
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

        {/* Worker Amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.black, fontWeight: '600' }}>
            Gesamtlohn für Arbeitnehmer (€)
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
          <Text style={{ color: colors.black, fontWeight: '600' }}>Zahlung an Arbeitnehmer</Text>
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
          title="Job veröffentlichen"
          onPress={handleSubmit}
        />

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}