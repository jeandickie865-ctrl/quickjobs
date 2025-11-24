// app/(worker)/jobs/[id].tsx - NEON TECH DESIGN
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getJobById } from '../../../utils/jobStore';
import { Job } from '../../../types/job';
import { euro } from '../../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';

// NEON COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#666666',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      if (!id) return;
      const data = await getJobById(String(id));
      setJob(data);
    } catch (err) {
      console.log('Job load error:', err);
    } finally {
      setLoading(false);
    }
  };
      Alert.alert('Fehler', err.message);
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.neon} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Job nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Title */}
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: '800', 
        marginBottom: 24,
        letterSpacing: -0.5 
      }}>
        {job.title}
      </Text>

      {/* Job Details Card - White */}
      <View
        style={{
          backgroundColor: colors.white,
          padding: 20,
          borderRadius: 18,
          marginBottom: 24,
          gap: 16,
        }}
      >
        {/* Description */}
        <View>
          <Text style={{ 
            color: colors.neon, 
            fontSize: 12, 
            fontWeight: '700', 
            letterSpacing: 0.5,
            marginBottom: 8 
          }}>
            BESCHREIBUNG
          </Text>
          <Text style={{ color: colors.black, fontSize: 16, lineHeight: 24 }}>
            {job.description || 'Keine Beschreibung'}
          </Text>
        </View>

        {/* Location */}
        <View>
          <Text style={{ 
            color: colors.neon, 
            fontSize: 12, 
            fontWeight: '700', 
            letterSpacing: 0.5,
            marginBottom: 8 
          }}>
            STANDORT
          </Text>
          <Text style={{ color: colors.black, fontSize: 16 }}>
            📍 {job.street}, {job.postal_code} {job.city}
          </Text>
        </View>

        {/* Categories */}
        <View>
          <Text style={{ 
            color: colors.neon, 
            fontSize: 12, 
            fontWeight: '700', 
            letterSpacing: 0.5,
            marginBottom: 8 
          }}>
            KATEGORIEN
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(job.categories || []).map((cat, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>
                  {cat}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Qualifications */}
        <View>
          <Text style={{ 
            color: colors.neon, 
            fontSize: 12, 
            fontWeight: '700', 
            letterSpacing: 0.5,
            marginBottom: 8 
          }}>
            QUALIFIKATIONEN
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(job.qualifications || []).map((qual, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>
                  {qual}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Apply Button - NEON */}
      <Pressable
        onPress={handleApply}
        disabled={hasApplied || isApplying}
        style={{
          backgroundColor: hasApplied || isApplying ? colors.gray400 : colors.neon,
          paddingVertical: 18,
          borderRadius: 18,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        {isApplying ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={{ 
            color: colors.black, 
            fontWeight: '700', 
            fontSize: 18,
            letterSpacing: 0.5 
          }}>
            {hasApplied ? '✓ Beworben' : 'Ich habe Zeit'}
          </Text>
        )}
      </Pressable>

      {hasApplied && (
        <View style={{
          backgroundColor: colors.neon,
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <Text style={{ color: colors.black, fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
            ✅ Deine Bewerbung wurde erfolgreich gesendet!
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
