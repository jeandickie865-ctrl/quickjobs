// app/(employer)/jobs/rate.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { getJobById } from '../../../utils/jobStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { addReview } from '../../../utils/reviewStore';
import { Job } from '../../../types/job';
import { WorkerProfile } from '../../../types/profile';

export default function RateWorkerScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string; workerId: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const jobData = await getJobById(params.jobId);
      const workerData = await getWorkerProfile(params.workerId);

      setJob(jobData);
      setWorker(workerData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!job || !worker || !user) return;

    if (rating < 1 || rating > 5) {
      Alert.alert('Fehler', 'Bitte wähle eine Sternebewertung (1-5)');
      return;
    }

    setSaving(true);
    try {
      const review = {
        id: `review-${Date.now()}`,
        jobId: params.jobId,
        workerId: params.workerId,
        employerId: user.id,
        rating,
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await addReview(review);

      console.log('✅ Review saved successfully', review);

      // Bestätigungs-Modal mit verbessertem Text
      Alert.alert(
        'Vielen Dank für deine Bewertung!',
        'Dein Feedback wurde erfolgreich gespeichert.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigation zurück zum Job-Detail
              router.push({
                pathname: '/(employer)/jobs/[id]',
                params: { id: params.jobId },
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error saving review:', error);
      Alert.alert('Fehler', 'Bewertung konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.black }}>Lade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job || !worker) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.black }}>Daten nicht gefunden</Text>
          <Button
            title="Zurück"
            onPress={() => router.back()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        >
          {/* Header */}
          <View>
            <Text style={{ color: colors.black, fontSize: 24, fontWeight: '800' }}>
              Arbeitskraft bewerten
            </Text>
          </View>

          {/* Job Info */}
          <View
            style={{
              backgroundColor: colors.white,
              padding: spacing.md,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.gray200,
            }}
          >
            <Text style={{ color: colors.gray700, fontSize: 13, marginBottom: 4 }}>
              Job
            </Text>
            <Text style={{ color: colors.black, fontSize: 16, fontWeight: '600' }}>
              {job.title}
            </Text>
            <Text style={{ color: colors.gray600, fontSize: 14, marginTop: 4 }}>
              Kategorie: {job.category}
            </Text>
          </View>

          {/* Worker Info */}
          <View
            style={{
              backgroundColor: colors.white,
              padding: spacing.md,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.gray200,
            }}
          >
            <Text style={{ color: colors.gray700, fontSize: 13, marginBottom: 4 }}>
              Arbeitnehmer
            </Text>
            <Text style={{ color: colors.black, fontSize: 16, fontWeight: '600' }}>
              {worker.firstName && worker.lastName
                ? `${worker.firstName} ${worker.lastName}`
                : worker.userId}
            </Text>
          </View>

          {/* Star Rating */}
          <View>
            <Text
              style={{
                color: colors.black,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: spacing.sm,
              }}
            >
              Bewertung *
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor:
                      rating >= star ? colors.black : colors.beige100,
                    borderWidth: 1,
                    borderColor: rating >= star ? colors.black : colors.gray200,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      color: rating >= star ? colors.white : colors.gray400,
                    }}
                  >
                    ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text
              style={{
                color: colors.gray600,
                fontSize: 14,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}
            >
              {rating === 1 && '1 Stern - Sehr unzufrieden'}
              {rating === 2 && '2 Sterne - Unzufrieden'}
              {rating === 3 && '3 Sterne - Neutral'}
              {rating === 4 && '4 Sterne - Zufrieden'}
              {rating === 5 && '5 Sterne - Sehr zufrieden'}
            </Text>
          </View>

          {/* Comment */}
          <View>
            <Text
              style={{
                color: colors.black,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: spacing.sm,
              }}
            >
              Kommentar (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Teile deine Erfahrungen mit dieser Arbeitskraft..."
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={4}
              maxLength={300}
              style={{
                borderWidth: 1,
                borderColor: colors.gray200,
                borderRadius: 12,
                padding: spacing.sm,
                backgroundColor: colors.white,
                color: colors.black,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
            <Text
              style={{
                color: colors.gray600,
                fontSize: 12,
                textAlign: 'right',
                marginTop: 4,
              }}
            >
              {comment.length} / 300
            </Text>
          </View>

          {/* Buttons */}
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Button
              title={saving ? 'Speichere...' : 'Bewertung speichern'}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
            />
            <Button
              title="Abbrechen"
              variant="ghost"
              onPress={() => router.back()}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
