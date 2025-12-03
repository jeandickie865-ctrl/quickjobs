// components/WorkerProfileEmployerView.tsx - BACKUP DARK DESIGN
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, ActivityIndicator, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

// Import taxonomy data
const TAXONOMY_DATA = require('../shared/taxonomy.json');

const COLORS = {
  background: '#0E0B1F',
  card: '#141126',
  neon: '#C8FF16',
  white: '#FFFFFF',
  lightText: '#E8E8E8',
  dimText: '#A0A0A0',
  border: '#2A2738',
  dimmed: 'rgba(14, 11, 31, 0.95)',
  purple: '#6B4BFF',
};

interface WorkerProfileEmployerViewProps {
  workerId: string;
  applicationId?: string;
  visible: boolean;
  onClose: () => void;
}

// Hilfsfunktion: Taxonomie in ein einheitliches Array bringen
function getAllCategoriesFromTaxonomy() {
  const data: any = TAXONOMY_DATA;

  // Neuer Stil: Objekt mit Keys
  if (!Array.isArray(data) && !data.categories) {
    return Object.entries(data).map(([key, value]: [string, any]) => ({
      key,
      ...(value || {}),
    }));
  }

  // Alter Stil: data.categories als Array
  if (Array.isArray(data.categories)) {
    return data.categories;
  }

  // Fallback
  return [];
}

export function WorkerProfileEmployerView({
  workerId,
  applicationId,
  visible,
  onClose,
}: WorkerProfileEmployerViewProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && workerId) {
      loadProfile();
    }
  }, [visible, workerId, applicationId]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      // Get authorization token from AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const userJson = await AsyncStorage.default.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const token = user?.id;

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build URL with optional application_id
      let url = `${BACKEND_URL}/api/profiles/worker/${workerId}/employer-view`;
      if (applicationId) {
        url += `?application_id=${applicationId}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading worker profile for employer:', err);
      setError(err.message || 'Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  }

  const getInitials = () => {
    if (!profile) return '';
    const first = profile.firstName?.charAt(0) || '';
    const last = profile.lastName?.charAt(0) || '';
    const sum = (first + last).trim();
    return sum ? sum.toUpperCase() : '?';
  };

  const isAccepted = profile?.isAcceptedMatch || false;

  const getDisplayName = () => {
    if (!profile) return '';
    const first: string = profile.firstName || '';
    const last: string = profile.lastName || '';

    if (!first && !last) {
      return 'Profil';
    }

    // Voller Name erst nach akzeptiertem Match
    if (isAccepted) {
      return `${first} ${last}`.trim();
    }

    if (first && last) {
      return `${first} ${last.charAt(0)}.`; // z. B. "Anna K."
    }

    return first || 'Profil';
  };

  const getCategoryLabels = () => {
    if (!profile?.categories) return [];
    const categories = getAllCategoriesFromTaxonomy();

    return profile.categories.map((catKey: string) => {
      const category = categories.find((c: any) => c.key === catKey);
      return category?.label || catKey;
    });
  };

  const getSubcategoryLabels = () => {
    if (!profile?.subcategories) return [];
    const labels: string[] = [];
    const categories = getAllCategoriesFromTaxonomy();

    profile.subcategories.forEach((subKey: string) => {
      categories.forEach((cat: any) => {
        const subcat = cat.subcategories?.find((s: any) => s.key === subKey);
        if (subcat) {
          labels.push(subcat.label);
        }
      });
    });

    return labels.length > 0 ? labels : profile.subcategories;
  };

  const getQualificationLabels = () => {
    if (!profile?.qualifications) return [];
    const labels: string[] = [];
    const categories = getAllCategoriesFromTaxonomy();

    profile.qualifications.forEach((qualKey: string) => {
      categories.forEach((cat: any) => {
        const qual = cat.qualifications?.find((q: any) => q.key === qualKey);
        if (qual) {
          labels.push(qual.label);
        }
      });
    });

    return labels.length > 0 ? labels : profile.qualifications;
  };

  const getTagLabels = () => {
    if (!profile?.selectedTags) return [];
    const labels: string[] = [];
    const categories = getAllCategoriesFromTaxonomy();

    profile.selectedTags.forEach((tagKey: string) => {
      categories.forEach((cat: any) => {
        const activity = cat.activities?.find((a: any) => a.key === tagKey);
        if (activity) {
          labels.push(activity.label);
          return;
        }
        const qual = cat.qualifications?.find((q: any) => q.key === tagKey);
        if (qual) {
          labels.push(qual.label);
        }
      });
    });

    return labels;
  };

  if (!visible) return null;

  const categoryLabels = getCategoryLabels();
  const subcategoryLabels = getSubcategoryLabels();
  const qualificationLabels = getQualificationLabels();
  const tagLabels = getTagLabels();
  const displayName = getDisplayName();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.dimmed }}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
            marginTop: 60,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {/* Header Bar */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: COLORS.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
              Worker-Profil
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.neon} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.neon} size="large" />
              <Text style={{ color: COLORS.dimText, marginTop: 16 }}>Lädt Profil...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Ionicons name="alert-circle" size={48} color={COLORS.dimText} />
              <Text style={{ color: COLORS.lightText, marginTop: 16, textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section */}
              <View
                style={{
                  backgroundColor: COLORS.card,
                  paddingHorizontal: 20,
                  paddingTop: 24,
                  paddingBottom: 30,
                  alignItems: 'center',
                  marginHorizontal: 16,
                  marginTop: 16,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                {/* Profile Image */}
                {profile.photoUrl || profile.profilePhotoUri ? (
                  <Image
                    source={{ uri: profile.photoUrl || profile.profilePhotoUri }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      borderWidth: 4,
                      borderColor: COLORS.neon,
                      marginBottom: 16,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: COLORS.purple,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 4,
                      borderColor: COLORS.neon,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 36, fontWeight: '700', color: COLORS.white }}>
                      {getInitials()}
                    </Text>
                  </View>
                )}

                {/* Name, je nach Status maskiert */}
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '900',
                    color: COLORS.white,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  {displayName}
                </Text>

                {/* Status Badge */}
                {isAccepted && (
                  <View
                    style={{
                      backgroundColor: COLORS.neon,
                      paddingHorizontal: 16,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.background }}>
                      Match bestätigt
                    </Text>
                  </View>
                )}

                {/* Categories */}
                {categoryLabels.length > 0 && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.neon,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    {categoryLabels.join(' • ')}
                  </Text>
                )}
              </View>

              {/* Content Area */}
              <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                {/* Über mich */}
                {profile.shortBio && (
                  <View
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="information-circle" size={22} color={COLORS.neon} />
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginLeft: 8,
                        }}
                      >
                        Über mich
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, color: COLORS.lightText, lineHeight: 22 }}>
                      {profile.shortBio}
                    </Text>
                  </View>
                )}

                {/* Adresse */}
                {profile.homeAddress && (
                  <View
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="location" size={22} color={COLORS.neon} />
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginLeft: 8,
                        }}
                      >
                        {isAccepted ? 'Wohnadresse' : 'Ort'}
                      </Text>
                    </View>

                    <View style={{ gap: 6 }}>
                      {isAccepted ? (
                        <>
                          {profile.homeAddress.street && (
                            <Text style={{ fontSize: 15, color: COLORS.lightText }}>
                              {profile.homeAddress.street}{' '}
                              {profile.homeAddress.houseNumber || ''}
                            </Text>
                          )}
                          {(profile.homeAddress.postalCode || profile.homeAddress.city) && (
                            <Text style={{ fontSize: 15, color: COLORS.lightText }}>
                              {profile.homeAddress.postalCode || ''}{' '}
                              {profile.homeAddress.city || ''}
                            </Text>
                          )}
                          {profile.homeAddress.country && (
                            <Text style={{ fontSize: 15, color: COLORS.lightText }}>
                              {profile.homeAddress.country}
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          {(profile.homeAddress.postalCode || profile.homeAddress.city) && (
                            <Text style={{ fontSize: 15, color: COLORS.lightText }}>
                              {profile.homeAddress.postalCode || ''}{' '}
                              {profile.homeAddress.city || ''}
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                )}

                {/* Tätigkeiten & Qualifikationen */}
                {(categoryLabels.length > 0 ||
                  subcategoryLabels.length > 0 ||
                  qualificationLabels.length > 0 ||
                  tagLabels.length > 0) && (
                  <View
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                    >
                      <Ionicons name="briefcase" size={22} color={COLORS.neon} />
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginLeft: 8,
                        }}
                      >
                        Tätigkeiten und Qualifikationen
                      </Text>
                    </View>

                    {/* Kategorien */}
                    {categoryLabels.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: COLORS.dimText,
                            marginBottom: 8,
                          }}
                        >
                          Kategorien
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {categoryLabels.map((label, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: COLORS.purple,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 20,
                              }}
                            >
                              <Text
                                style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}
                              >
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Subcategories */}
                    {subcategoryLabels.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: COLORS.dimText,
                            marginBottom: 8,
                          }}
                        >
                          Tätigkeiten
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {subcategoryLabels.map((label, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: COLORS.neon,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 20,
                              }}
                            >
                              <Text
                                style={{ fontSize: 13, fontWeight: '600', color: '#000' }}
                              >
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Qualifications */}
                    {qualificationLabels.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: COLORS.dimText,
                            marginBottom: 8,
                          }}
                        >
                          Qualifikationen
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {qualificationLabels.map((label, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: 'rgba(107,75,255,0.2)',
                                borderWidth: 1,
                                borderColor: COLORS.purple,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 16,
                              }}
                            >
                              <Text
                                style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}
                              >
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Legacy Tags */}
                    {tagLabels.length > 0 && (
                      <View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: COLORS.dimText,
                            marginBottom: 8,
                          }}
                        >
                          Weitere Qualifikationen
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {tagLabels.map((label, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: COLORS.card,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 16,
                              }}
                            >
                              <Text
                                style={{ fontSize: 13, fontWeight: '600', color: COLORS.lightText }}
                              >
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Kontaktinformationen nur bei akzeptiertem Match */}
                {isAccepted && (profile.email || profile.phone) && (
                  <View
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                    >
                      <Ionicons name="call" size={22} color={COLORS.neon} />
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginLeft: 8,
                        }}
                      >
                        Kontaktinformationen
                      </Text>
                    </View>

                    {profile.email && (
                      <View style={{ marginBottom: 12 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons name="mail-outline" size={16} color={COLORS.dimText} />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: COLORS.dimText,
                              marginLeft: 6,
                            }}
                          >
                            E-Mail
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            color: COLORS.white,
                            marginLeft: 22,
                          }}
                        >
                          {profile.email}
                        </Text>
                      </View>
                    )}

                    {profile.phone && (
                      <View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons name="call-outline" size={16} color={COLORS.dimText} />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: COLORS.dimText,
                              marginLeft: 6,
                            }}
                          >
                            Telefon
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 15,
                            color: COLORS.white,
                            marginLeft: 22,
                          }}
                        >
                          {profile.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Arbeitsradius */}
                {profile.radiusKm && (
                  <View
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 16,
                      padding: 24,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                    >
                      <Ionicons name="location" size={22} color={COLORS.neon} />
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginLeft: 8,
                        }}
                      >
                        Arbeitsradius
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 48,
                        fontWeight: '900',
                        color: COLORS.purple,
                      }}
                    >
                      {profile.radiusKm}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: COLORS.dimText,
                        marginTop: 4,
                      }}
                    >
                      Kilometer Umkreis
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
