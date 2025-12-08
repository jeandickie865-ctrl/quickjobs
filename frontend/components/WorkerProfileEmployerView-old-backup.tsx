// components/WorkerProfileEmployerView.tsx - EMPLOYER VIEW OF WORKER PROFILE
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, ActivityIndicator, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

// Import taxonomy data
const TAXONOMY_DATA = require('../shared/taxonomy.json');

const COLORS = {
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#FFFFFF',
  black: '#FFFFFF',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  borderGray: '#E0E0E0',
  dimmed: 'rgba(0,0,0,0.7)',
};

interface WorkerProfileEmployerViewProps {
  workerId: string;
  applicationId?: string;
  visible: boolean;
  onClose: () => void;
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
          'Authorization': `Bearer ${token}`,
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
    return (first + last).toUpperCase();
  };

  const getCategoryLabels = () => {
    if (!profile?.categories) return [];
    return profile.categories.map((catKey: string) => {
      const category = TAXONOMY_DATA.categories.find((c: any) => c.key === catKey);
      return category?.label || catKey;
    });
  };

  const getSubcategoryLabels = () => {
    if (!profile?.subcategories) return [];
    const labels: string[] = [];
    
    profile.subcategories.forEach((subKey: string) => {
      // Try to find label in taxonomy
      Object.values(TAXONOMY_DATA).forEach((cat: any) => {
        const subcat = cat.subcategories?.find((s: any) => s.key === subKey);
        if (subcat) {
          labels.push(subcat.label);
        }
      });
    });
    
    return labels.length > 0 ? labels : profile.subcategories; // Fallback to keys if no labels found
  };

  const getQualificationLabels = () => {
    if (!profile?.qualifications) return [];
    const labels: string[] = [];
    
    profile.qualifications.forEach((qualKey: string) => {
      // Try to find label in taxonomy
      Object.values(TAXONOMY_DATA).forEach((cat: any) => {
        const qual = cat.qualifications?.find((q: any) => q.key === qualKey);
        if (qual) {
          labels.push(qual.label);
        }
      });
    });
    
    return labels.length > 0 ? labels : profile.qualifications; // Fallback to keys if no labels found
  };

  const getTagLabels = () => {
    if (!profile?.selectedTags) return [];
    const tags: string[] = [];
    
    profile.selectedTags.forEach((tagKey: string) => {
      TAXONOMY_DATA.categories.forEach((cat: any) => {
        const activity = cat.activities?.find((a: any) => a.key === tagKey);
        if (activity) {
          tags.push(activity.label);
          return;
        }
        const qual = cat.qualifications?.find((q: any) => q.key === tagKey);
        if (qual) {
          tags.push(qual.label);
        }
      });
    });
    
    return tags;
  };

  if (!visible) return null;

  const categoryLabels = getCategoryLabels();
  const subcategoryLabels = getSubcategoryLabels();
  const qualificationLabels = getQualificationLabels();
  const tagLabels = getTagLabels();
  const isAccepted = profile?.isAcceptedMatch || false;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.dimmed }}>
        <View style={{
          flex: 1,
          backgroundColor: COLORS.lightGray,
          marginTop: 60,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}>
          {/* Header Bar */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: COLORS.purple,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
              Worker-Profil
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.purple} size="large" />
              <Text style={{ color: COLORS.darkGray, marginTop: 16 }}>Lädt Profil...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Ionicons name="alert-circle" size={48} color={COLORS.darkGray} />
              <Text style={{ color: COLORS.darkGray, marginTop: 16, textAlign: 'center' }}>
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
              <View style={{
                backgroundColor: COLORS.purple,
                paddingHorizontal: 20,
                paddingBottom: 30,
                alignItems: 'center',
              }}>
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
                  <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: COLORS.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 4,
                    borderColor: COLORS.neon,
                    marginBottom: 16,
                  }}>
                    <Text style={{ fontSize: 36, fontWeight: '700', color: COLORS.purple }}>
                      {getInitials()}
                    </Text>
                  </View>
                )}

                {/* Name - Full or Masked */}
                <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.white, marginBottom: 8 }}>
                  {profile.firstName} {profile.lastName}
                </Text>

                {/* Status Badge */}
                {isAccepted && (
                  <View style={{
                    backgroundColor: COLORS.neon,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginBottom: 8,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.black }}>
                      ✓ MATCH BESTÄTIGT
                    </Text>
                  </View>
                )}

                {/* Categories */}
                {categoryLabels.length > 0 && (
                  <Text style={{ fontSize: 14, color: COLORS.neon, fontWeight: '600' }}>
                    {categoryLabels.join(' • ')}
                  </Text>
                )}
              </View>

              {/* Content Area */}
              <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
                
                {/* Über mich */}
                {profile.shortBio && (
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="information-circle" size={22} color={COLORS.purple} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                        Über mich
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, color: COLORS.darkGray, lineHeight: 22 }}>
                      {profile.shortBio}
                    </Text>
                  </View>
                )}

                {/* Adresse - Different for accepted/not accepted */}
                {(isAccepted && profile.homeAddress) || (!isAccepted && profile.homeAddress) ? (
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="location" size={22} color={COLORS.purple} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                        {isAccepted ? 'Wohnadresse' : 'Ort'}
                      </Text>
                    </View>
                    <View style={{ gap: 6 }}>
                      {isAccepted && profile.homeAddress ? (
                        <>
                          <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                            {profile.homeAddress.street} {profile.homeAddress.houseNumber || ''}
                          </Text>
                          <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                            {profile.homeAddress.postalCode} {profile.homeAddress.city}
                          </Text>
                          {profile.homeAddress.country && (
                            <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                              {profile.homeAddress.country}
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Nur PLZ + Stadt für nicht-akzeptierte */}
                          <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                            {profile.homeAddress?.postalCode} {profile.homeAddress?.city}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                ) : null}

                {/* Tätigkeiten & Qualifikationen */}
                {(categoryLabels.length > 0 || tagLabels.length > 0) && (
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      <Ionicons name="briefcase" size={22} color={COLORS.purple} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                        Tätigkeiten & Qualifikationen
                      </Text>
                    </View>

                    {/* Kategorien */}
                    {categoryLabels.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                          KATEGORIEN
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {categoryLabels.map((label, idx) => (
                            <View key={idx} style={{
                              backgroundColor: COLORS.purple,
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                            }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Subcategories (NEW) */}
                    {subcategoryLabels.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                          TÄTIGKEITEN
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {subcategoryLabels.map((label, idx) => (
                            <View key={idx} style={{
                              backgroundColor: COLORS.neon,
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                            }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.black }}>
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Qualifications (NEW) */}
                    {qualificationLabels.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                          QUALIFIKATIONEN
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {qualificationLabels.map((label, idx) => (
                            <View key={idx} style={{
                              backgroundColor: COLORS.lightGray,
                              borderWidth: 1,
                              borderColor: COLORS.borderGray,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                            }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.darkGray }}>
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Tags (DEPRECATED - kept for backward compatibility) */}
                    {tagLabels.length > 0 && (
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                          WEITERE QUALIFIKATIONEN (LEGACY)
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {tagLabels.map((label, idx) => (
                            <View key={idx} style={{
                              backgroundColor: COLORS.lightGray,
                              borderWidth: 1,
                              borderColor: COLORS.borderGray,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                            }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.darkGray }}>
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Kontaktinformationen - Only for accepted */}
                {isAccepted && (profile.email || profile.phone) && (
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      <Ionicons name="call" size={22} color={COLORS.purple} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                        Kontaktinformationen
                      </Text>
                    </View>

                    {profile.email && (
                      <View style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="mail-outline" size={16} color={COLORS.darkGray} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginLeft: 6 }}>
                            E-MAIL
                          </Text>
                        </View>
                        <Text style={{ fontSize: 15, color: COLORS.darkGray, marginLeft: 22 }}>
                          {profile.email}
                        </Text>
                      </View>
                    )}

                    {profile.phone && (
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="call-outline" size={16} color={COLORS.darkGray} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginLeft: 6 }}>
                            TELEFON
                          </Text>
                        </View>
                        <Text style={{ fontSize: 15, color: COLORS.darkGray, marginLeft: 22 }}>
                          {profile.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Arbeitsradius */}
                {profile.radiusKm && (
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    alignItems: 'center',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      <Ionicons name="location" size={22} color={COLORS.purple} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                        Arbeitsradius
                      </Text>
                    </View>
                    <Text style={{ fontSize: 48, fontWeight: '900', color: COLORS.purple }}>
                      {profile.radiusKm}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
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
