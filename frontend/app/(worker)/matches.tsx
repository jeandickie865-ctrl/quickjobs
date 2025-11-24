// app/(worker)/matches.tsx - FINAL NEON-TECH DESIGN
import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl, Pressable, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsForWorker } from '../../utils/applicationStore';
import { getJobs } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { formatJobTimeDisplay } from '../../utils/date';
import { isWithinLast24Hours } from '../../utils/stringHelpers';
import { getInitials } from '../../utils/stringHelpers';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  neonShadow: 'rgba(200,255,22,0.15)',
  dimmed: 'rgba(0,0,0,0.7)',
};

type Match = {
  job: Job;
  application: JobApplication;
};

export default function WorkerMatchesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadMatches = async () => {
    if (!user) return;

    try {
      setError(null);

      const apps = await getApplicationsForWorker(user.id);
      // Show both pending and accepted applications
      const relevantApps = apps.filter((a) => 
        a.status === 'pending' || a.status === 'accepted'
      );
      const allJobs = await getJobs();

      const combined: Match[] = [];

      for (const app of relevantApps) {
        const job = allJobs.find((j) => j.id === app.jobId);
        if (job) {
          combined.push({ job, application: app });
        }
      }

      combined.sort((a, b) => {
        const dateA = a.application.respondedAt || a.application.createdAt;
        const dateB = b.application.respondedAt || b.application.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setMatches(combined);
    } catch (e) {
      console.error('Error loading matches:', e);
      setError('Matches konnten nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadMatches();
    }
  }, [user, authLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Matches...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        left: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.12,
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
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '900', 
            color: COLORS.white,
            letterSpacing: 0.2,
          }}>
            Meine Bewerbungen
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => setShowTaxModal(true)}>
              <Ionicons name="information-circle-outline" size={26} color={COLORS.neon} />
            </Pressable>
            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={26} color={COLORS.neon} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.neon} />
        }
      >
        {error && (
          <View style={{
            padding: 16,
            backgroundColor: '#FBECEC',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#E34242',
          }}>
            <Text style={{ color: '#E34242', fontSize: 14, fontWeight: '600' }}>
              ⚠️ {error}
            </Text>
          </View>
        )}

        {matches.length === 0 ? (
          <View style={{
            padding: 32,
            backgroundColor: COLORS.white,
            borderRadius: 18,
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ color: COLORS.black, fontSize: 18, textAlign: 'center', fontWeight: '700' }}>
              Noch keine Bewerbungen
            </Text>
            <Text style={{ color: COLORS.darkGray, fontSize: 14, textAlign: 'center' }}>
              Bewirb dich auf Jobs, um deine Bewerbungen hier zu sehen!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {matches.map(({ job, application }) => {
              const timeDisplay = formatJobTimeDisplay(
                job.startAt,
                job.endAt,
                job.timeMode,
                job.hours,
                job.dueAt
              );
              const isNew = application.respondedAt && isWithinLast24Hours(application.respondedAt);
              const employerName = job.employerName || 'Auftraggeber';
              const employerInitials = getInitials(employerName);

              return (
                <View
                  key={application.id}
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 18,
                    padding: 20,
                    shadowColor: COLORS.neon,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  {/* Header mit Initialen + Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                    {/* Initialen-Kreis */}
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: COLORS.purple,
                      borderWidth: 3,
                      borderColor: COLORS.neon,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
                        {employerInitials}
                      </Text>
                    </View>

                    {/* Job Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '700', 
                        color: COLORS.purple,
                        marginBottom: 4,
                      }}>
                        {job.title}
                      </Text>
                      <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                        von {employerName}
                      </Text>
                    </View>

                    {/* Badge */}
                    {isNew && (
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: COLORS.neon,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.black }}>
                          NEU
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Status Badge */}
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: application.status === 'accepted' ? COLORS.neon : '#FFF3CD',
                    borderRadius: 10,
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.black }}>
                      {application.status === 'accepted' ? '✓ Akzeptiert' : '⏳ Warte auf Antwort'}
                    </Text>
                  </View>

                  {/* Job Details */}
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      📦 {job.category}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      🕐 {timeDisplay}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      📍 {formatAddress(job.location)}
                    </Text>
                  </View>

                  {/* Preis */}
                  <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 16 }}>
                    {euro(job.workerAmountCents)} / {job.timeMode === 'hours' ? 'Stunde' : 'Gesamt'}
                  </Text>

                  {/* Action Button */}
                  {application.status === 'accepted' ? (
                    <Pressable
                      onPress={() => router.push(`/chat/${application.id}`)}
                      style={({ pressed }) => ({
                        backgroundColor: COLORS.neon,
                        paddingVertical: 14,
                        borderRadius: 16,
                        alignItems: 'center',
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                        💬 Zum Chat
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{
                      backgroundColor: '#E8E8E8',
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#666' }}>
                        Warte auf Antwort...
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* Steuer-Hinweis Modal */}
      <Modal
        visible={showTaxModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTaxModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: COLORS.dimmed,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Header mit Neon-Akzent */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 2,
              borderBottomColor: COLORS.neon,
            }}>
              <Ionicons name="information-circle" size={32} color={COLORS.neon} />
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                color: COLORS.purple,
                marginLeft: 12,
              }}>
                Wichtiger Hinweis
              </Text>
            </View>

            {/* Content */}
            <View style={{ gap: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
                <Text style={{ fontWeight: '700' }}>Steuern & Versicherung:</Text>
                {'\n'}
                Die Bezahlung erfolgt direkt zwischen dir und dem Auftraggeber.
              </Text>
              
              <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
                <Text style={{ fontWeight: '700' }}>Deine Verantwortung:</Text>
                {'\n'}
                • Steuern selbst abführen
                {'\n'}
                • Versicherungen eigenständig regeln
                {'\n'}
                • Rechtliche Pflichten beachten
              </Text>

              <View style={{
                padding: 12,
                backgroundColor: '#FFF3CD',
                borderRadius: 10,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.neon,
              }}>
                <Text style={{ fontSize: 13, color: COLORS.darkGray, fontWeight: '600' }}>
                  💡 Bei Fragen wende dich an einen Steuerberater.
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => setShowTaxModal(false)}
              style={({ pressed }) => ({
                backgroundColor: COLORS.neon,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                Verstanden
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
