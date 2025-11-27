// app/(worker)/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { WorkerProfile, WorkerDocument } from '../../types/profile';
import { getWorkerProfile, saveWorkerProfile } from '../../utils/profileStore';
import { RADIUS_OPTIONS_KM, DEFAULT_RADIUS_KM } from '../../constants/radius';
import { listCategories, groupTagsByType, normalizeCategories, CategoryKey } from '../../src/taxonomy';
import Chip from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { ProfilePhoto } from '../../components/ProfilePhoto';
import { DocumentManager } from '../../components/DocumentManager';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { getReviewsForWorker, calculateAverageRating } from '../../utils/reviewStore';
import { Review } from '../../types/review';
import { StarRating } from '../../components/StarRating';

function createEmptyProfile(userId: string): WorkerProfile {
  return {
    userId,
    categories: [],
    selectedTags: [],
    radiusKm: DEFAULT_RADIUS_KM,
    homeAddress: {},  // Leeres Address-Objekt
    homeLat: null,    // null statt undefined - korrekt typisiert
    homeLon: null,    // null statt undefined - korrekt typisiert
    profilePhotoUri: undefined,
    documents: [],
  };
}

export default function WorkerProfileScreen() {
  const { colors, spacing } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // initial laden
  useEffect(() => {
    if (!user) return;
    (async () => {
      const stored = await getWorkerProfile(user.id);
      if (stored) {
        // Normalize categories to remove invalid/old keys
        const normalizedCategories = normalizeCategories(stored.categories ?? []);
        if (normalizedCategories.length !== (stored.categories ?? []).length) {
          console.log('🔧 Normalized categories:', stored.categories, '→', normalizedCategories);
        }
        setProfile({ ...stored, categories: normalizedCategories });
      } else {
        setProfile(createEmptyProfile(user.id));
      }
      setIsLoading(false);
    })();
  }, [user]);

  // Reviews laden
  useEffect(() => {
    if (!user) return;
    (async () => {
      setReviewsLoading(true);
      try {
        const workerReviews = await getReviewsForWorker(user.id);
        setReviews(workerReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [user]);

  const categories = useMemo(() => listCategories(), []);
  const selectedCategories = profile?.categories ?? [];
  const selectedTagsSet = new Set(profile?.selectedTags ?? []);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <Text style={{ color: colors.black }}>Bitte zuerst einloggen.</Text>
      </View>
    );
  }

  if (isLoading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.gray900} />
      </View>
    );
  }

  function toggleCategory(key: string) {
    const next = new Set(profile.categories ?? []);
    if (next.has(key)) {
      next.delete(key);
      // Tags der Kategorie rausschmeißen
      const allTags = groupTagsByType(key as CategoryKey);
      const keysToRemove = [
        ...allTags.qual,
        ...allTags.role,
        ...allTags.vehicle,
        ...allTags.license,
        ...allTags.doc,
        ...allTags.skill,
        ...allTags.tool
      ].map(t => t.key);
      const newTags = (profile.selectedTags ?? []).filter(t => !keysToRemove.includes(t));
      setProfile({ ...profile, categories: Array.from(next), selectedTags: newTags });
    } else {
      next.add(key);
      setProfile({ ...profile, categories: Array.from(next) });
    }
  }

  function toggleTag(catKey: CategoryKey, tagKey: string) {
    // nur wenn Kategorie auch gewählt ist
    if (!profile.categories.includes(catKey)) return;
    const set = new Set(profile.selectedTags ?? []);
    if (set.has(tagKey)) set.delete(tagKey);
    else set.add(tagKey);
    setProfile({ ...profile, selectedTags: Array.from(set) });
  }

  function handlePhotoSelected(uri: string) {
    setProfile({ ...profile, profilePhotoUri: uri });
  }

  function handlePhotoRemove() {
    setProfile({ ...profile, profilePhotoUri: undefined });
  }

  function handleDocumentAdd(doc: Omit<WorkerDocument, 'id' | 'uploadedAt'>) {
    const newDoc: WorkerDocument = {
      ...doc,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
    };
    setProfile({
      ...profile,
      documents: [...(profile.documents || []), newDoc],
    });
  }

  function handleDocumentRemove(documentId: string) {
    setProfile({
      ...profile,
      documents: (profile.documents || []).filter((d) => d.id !== documentId),
    });
  }

  async function handleSave() {
    if (isSaving) return; // Prevent double-save
    
    setIsSaving(true);
    
    try {
      // === VALIDATION START ===
      console.log('🔍 Validating profile before save', {
        street: profile.homeAddress?.street,
        postalCode: profile.homeAddress?.postalCode,
        city: profile.homeAddress?.city,
        homeLat: profile.homeLat,
        homeLon: profile.homeLon,
        categories: profile.categories?.length,
      });

      // 1. Check street
      if (!profile.homeAddress?.street || profile.homeAddress.street.trim().length === 0) {
        console.log('❌ Profile validation failed: street missing');
        alert('Bitte gib eine Straße ein.');
        setIsSaving(false);
        return;
      }

      // 2. Check city
      if (!profile.homeAddress?.city || profile.homeAddress.city.trim().length === 0) {
        console.log('❌ Profile validation failed: city missing');
        alert('Bitte gib eine Stadt ein.');
        setIsSaving(false);
        return;
      }

      // 3. Check postal code (must be 5 digits)
      if (!profile.homeAddress?.postalCode || profile.homeAddress.postalCode.length !== 5) {
        console.log('❌ Profile validation failed: invalid postalCode');
        alert('Bitte gib eine gültige 5-stellige Postleitzahl ein.');
        setIsSaving(false);
        return;
      }

      // 4. Check coordinates (MUST NOT be 0 or missing)
      if (!profile.homeLat || !profile.homeLon || profile.homeLat === 0 || profile.homeLon === 0) {
        console.log('❌ Profile validation failed: coordinates missing', {
          homeLat: profile.homeLat,
          homeLon: profile.homeLon,
        });
        alert('Bitte Adresse aus Vorschlag auswählen, damit die Karte sie erkennt.');
        setIsSaving(false);
        return;
      }

      // 5. Check categories
      if (!profile.categories || profile.categories.length === 0) {
        console.log('❌ Profile validation failed: no categories');
        alert('Bitte wähle mindestens eine Kategorie aus.');
        setIsSaving(false);
        return;
      }

      // === VALIDATION PASSED ===
      console.log('✅ Profile validation passed');

      // *** KORREKTES SPEICHERN - ALLE FELDER ÜBERNEHMEN ***
      // KEINE Dummy-Werte wie 0 setzen!
      const profileToSave: WorkerProfile = {
        userId: profile.userId,
        
        // Arrays - sicherstellen dass sie nie undefined sind
        categories: profile.categories ?? [],
        selectedTags: profile.selectedTags ?? [],
        
        // Radius
        radiusKm: profile.radiusKm,
        
        // Adresse - komplettes Objekt
        homeAddress: profile.homeAddress,
        
        // Koordinaten - NIEMALS 0 als Fallback, nur echte Werte oder null
        homeLat: profile.homeLat ?? null,
        homeLon: profile.homeLon ?? null,
        
        // Optionale Felder - alle übernehmen
        profilePhotoUri: profile.profilePhotoUri,
        documents: profile.documents ?? [],
        firstName: profile.firstName,
        lastName: profile.lastName,
        shortBio: profile.shortBio,
        contactPhone: profile.contactPhone,
        contactEmail: profile.contactEmail,
        pushToken: profile.pushToken,
      };

      console.log('💾 Saving profile with all fields', profileToSave);
      
      await saveWorkerProfile(profileToSave);
      
      console.log('✅ Profile saved successfully');
      
      // Verify save by reloading
      const reloadedProfile = await getWorkerProfile(user.id);
      console.log('🔄 Profile reloaded for verification', reloadedProfile);
      
      // Show success toast
      alert('✅ Profil gespeichert');
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      alert('Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setIsSaving(false);
    }
  }

  const averageRating = reviews.length > 0 ? calculateAverageRating(reviews) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.beige50 }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md }}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
          Dein Profil
        </Text>
        <Text style={{ fontSize: 14, color: colors.gray500, marginTop: 4 }}>
          Verwalte deine Kategorien, Skills und Verfügbarkeit
        </Text>
      </View>

      {/* Bewertungen */}
      {!reviewsLoading && (
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: spacing.md,
            gap: spacing.sm,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text style={{ color: colors.black, fontWeight: '700', fontSize: 17 }}>
            ⭐ Bewertungen
          </Text>

          {reviews.length > 0 ? (
            <>
              {/* Durchschnittsbewertung */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 10,
                padding: spacing.sm,
                backgroundColor: colors.successLight,
                borderRadius: 10,
                borderLeftWidth: 4,
                borderLeftColor: colors.success,
              }}>
                <StarRating rating={averageRating} size={22} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.black, fontSize: 18, fontWeight: '800' }}>
                    {averageRating.toFixed(1)} von 5
                  </Text>
                  <Text style={{ color: colors.gray600, fontSize: 13 }}>
                    {reviews.length} {reviews.length === 1 ? 'Bewertung' : 'Bewertungen'}
                  </Text>
                </View>
              </View>

              {/* Letzte 3 Bewertungen */}
              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Neueste Bewertungen
                </Text>
                {reviews
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map((review) => (
                    <View
                      key={review.id}
                      style={{
                        backgroundColor: colors.beige50,
                        padding: spacing.sm,
                        borderRadius: 10,
                        gap: 6,
                        borderWidth: 1,
                        borderColor: colors.beige200,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <StarRating rating={review.rating} size={16} />
                        <Text style={{ color: colors.gray500, fontSize: 12, fontWeight: '500' }}>
                          {new Date(review.createdAt).toLocaleDateString('de-DE', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </View>
                      {review.comment && (
                        <Text style={{ color: colors.gray700, fontSize: 14, lineHeight: 20, fontStyle: 'italic' }}>
                          "{review.comment}"
                        </Text>
                      )}
                    </View>
                  ))}
              </View>
            </>
          ) : (
            <Text style={{ color: colors.gray500, fontSize: 14 }}>
              Noch keine Bewertungen.
            </Text>
          )}
        </View>
      )}

      {/* Profilfoto */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.gray200,
        }}
      >
        <ProfilePhoto
          photoUri={profile.profilePhotoUri}
          userName={user.email}
          onPhotoSelected={handlePhotoSelected}
          onPhotoRemove={handlePhotoRemove}
        />
      </View>

      {/* Dokumente */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.gray200,
        }}
      >
        <DocumentManager
          documents={profile.documents || []}
          onDocumentAdd={handleDocumentAdd}
          onDocumentRemove={handleDocumentRemove}
        />
      </View>

      {/* Persönliche Daten */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>Persönliche Daten</Text>
        <TextInput
          placeholder="Vorname"
          placeholderTextColor={colors.gray400}
          value={profile.firstName || ''}
          onChangeText={text => setProfile({ ...profile, firstName: text })}
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
        <TextInput
          placeholder="Nachname"
          placeholderTextColor={colors.gray400}
          value={profile.lastName || ''}
          onChangeText={text => setProfile({ ...profile, lastName: text })}
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

      {/* Steckbrief */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>Steckbrief</Text>
        <Text style={{ color: colors.gray600, fontSize: 13 }}>
          Beschreibe dich kurz. Dieser Text wird Auftraggebern vor dem Match angezeigt.
        </Text>
        <TextInput
          placeholder="z.B. Erfahrener Sicherheitsmitarbeiter mit 5 Jahren Erfahrung..."
          placeholderTextColor={colors.gray400}
          value={profile.shortBio || ''}
          onChangeText={text => setProfile({ ...profile, shortBio: text })}
          multiline
          numberOfLines={4}
          style={{
            borderWidth: 1,
            borderColor: colors.gray200,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: colors.white,
            color: colors.black,
            minHeight: 100,
            textAlignVertical: 'top'
          }}
        />
      </View>

      {/* Kontaktdaten */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>Kontaktdaten</Text>
        <Text style={{ color: colors.gray600, fontSize: 13 }}>
          Diese Daten werden nur nach einem Match freigegeben.
        </Text>
        <TextInput
          placeholder="Telefonnummer"
          placeholderTextColor={colors.gray400}
          value={profile.contactPhone || ''}
          onChangeText={text => setProfile({ ...profile, contactPhone: text })}
          keyboardType="phone-pad"
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
        <TextInput
          placeholder="Kontakt-E-Mail"
          placeholderTextColor={colors.gray400}
          value={profile.contactEmail || ''}
          onChangeText={text => setProfile({ ...profile, contactEmail: text })}
          keyboardType="email-address"
          autoCapitalize="none"
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

      {/* Adresse */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>Adresse (für Radius)</Text>
        <Text style={{ color: colors.gray600, fontSize: 13 }}>
          Deine Heimatadresse wird für spätere Entfernungsberechnungen verwendet. Tippe mindestens 3 Buchstaben für Vorschläge.
        </Text>
        
        <AddressAutocompleteInput
          street={profile.homeAddress.street || ''}
          postalCode={profile.homeAddress.postalCode}
          city={profile.homeAddress.city}
          onStreetChange={(value) => {
            setProfile({
              ...profile,
              homeAddress: { ...profile.homeAddress, street: value },
              homeLat: undefined, // Reset coordinates when manually changing
              homeLon: undefined,
            });
          }}
          onPostalCodeChange={(value) => {
            setProfile({
              ...profile,
              homeAddress: { ...profile.homeAddress, postalCode: value },
            });
          }}
          onCityChange={(value) => {
            setProfile({
              ...profile,
              homeAddress: { ...profile.homeAddress, city: value },
            });
          }}
          onLatChange={(value) => {
            console.log('📍 Coordinates updated - Lat:', value);
            setProfile({ ...profile, homeLat: value });
          }}
          onLonChange={(value) => {
            console.log('📍 Coordinates updated - Lon:', value);
            setProfile({ ...profile, homeLon: value });
          }}
          onGeocodingError={(error) => {
            console.log('❌ Geocoding error:', error);
            alert(error);
          }}
          placeholder="Straße und Hausnummer"
        />
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            placeholder="PLZ"
            placeholderTextColor={colors.gray400}
            value={profile.homeAddress.postalCode || ''}
            onChangeText={text => setProfile({ 
              ...profile, 
              homeAddress: { ...profile.homeAddress, postalCode: text }
            })}
            keyboardType="number-pad"
            maxLength={5}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.white,
              color: colors.black
            }}
          />
          
          <TextInput
            placeholder="Stadt"
            placeholderTextColor={colors.gray400}
            value={profile.homeAddress.city || ''}
            onChangeText={text => setProfile({ 
              ...profile, 
              homeAddress: { ...profile.homeAddress, city: text }
            })}
            style={{
              flex: 2,
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

      {/* Radius */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>Suchradius</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {RADIUS_OPTIONS_KM.map(r => (
            <Chip
              key={r}
              label={`${r} km`}
              selected={profile.radiusKm === r}
              onPress={() => setProfile({ ...profile, radiusKm: r })}
            />
          ))}
        </View>
      </View>

      {/* Kategorien */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.black, fontWeight: '600', fontSize: 16 }}>Kategorien</Text>
        <Text style={{ color: colors.gray600, fontSize: 13 }}>
          Wähle eine oder mehrere Kategorien aus, in denen du arbeiten möchtest.
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          style={{ marginHorizontal: -spacing.md }}
        >
          <View style={{ width: spacing.md }} />
          {categories.map(c => {
            const isSelected = selectedCategories.includes(c.key);
            return (
              <Pressable
                key={c.key}
                onPress={() => toggleCategory(c.key)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.black : colors.gray200,
                  backgroundColor: isSelected ? colors.black : colors.beige100,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? colors.white : colors.black,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {c.title}
                </Text>
              </Pressable>
            );
          })}
          <View style={{ width: spacing.md }} />
        </ScrollView>
      </View>

      {/* Hinweis wenn keine Kategorie gewählt */}
      {selectedCategories.length === 0 && (
        <View
          style={{
            padding: spacing.md,
            backgroundColor: colors.beige100,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}
        >
          <Text style={{ color: colors.gray700, fontSize: 14, textAlign: 'center' }}>
            👆 Wähle mindestens eine Kategorie aus, um passende Aufträge zu finden
          </Text>
        </View>
      )}

      {/* Tags pro gewählter Kategorie */}
      {selectedCategories.map(catKey => {
        try {
          const groups = groupTagsByType(catKey as CategoryKey);
          
          // Safety check
          if (!groups || (!groups.activities && !groups.qualifications)) {
            console.warn(`⚠️ No groups returned for category: ${catKey}`);
            return null;
          }
          
          const hasAny = groups.activities.length > 0 || groups.qualifications.length > 0;

          if (!hasAny) return null;

        return (
          <View key={catKey} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, padding: spacing.sm, gap: 8, backgroundColor: colors.white }}>
            <Text style={{ color: colors.black, fontWeight: '700' }}>
              {categories.find(c => c.key === catKey)?.title}
            </Text>

            {groups.activities.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 12 }}>Tätigkeiten</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {groups.activities.sort((a, b) => a.localeCompare(b)).map(tagLabel => (
                    <Chip
                      key={tagLabel}
                      label={tagLabel}
                      selected={selectedTagsSet.has(tagLabel)}
                      onPress={() => toggleTag(catKey as CategoryKey, tagLabel)}
                    />
                  ))}
                </View>
              </View>
            )}

            {groups.qualifications.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.gray700, fontWeight: '600', fontSize: 12 }}>Qualifikationen</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {groups.qualifications.sort((a, b) => a.localeCompare(b)).map(tagLabel => (
                    <Chip
                      key={tagLabel}
                      label={tagLabel}
                      selected={selectedTagsSet.has(tagLabel)}
                      onPress={() => toggleTag(catKey as CategoryKey, tagLabel)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        );
        } catch (error) {
          console.error(`❌ Error rendering tags for category ${catKey}:`, error);
          return null;
        }
      })}

      {/* Rechtliches */}
      <View
        style={{
          marginTop: spacing.xl,
          padding: spacing.md,
          backgroundColor: colors.white,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.gray200,
        }}
      >
        <Text
          style={{ fontSize: 14, color: colors.gray700, textDecorationLine: 'underline' }}
          onPress={() => router.push('/legal')}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black }}>
            Rechtliches
          </Text>
          {'\n'}
          <Text style={{ fontSize: 13, color: colors.gray600 }}>
            Alles zu AGB, Datenschutz und Betreiber.
          </Text>
        </Text>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Button 
          title={isSaving ? 'Speichern…' : 'Profil speichern'} 
          onPress={handleSave} 
          disabled={isSaving} 
        />
        <Button
          title={isSaving ? 'Speichern…' : 'Speichern und weiter'}
          variant="secondary"
          onPress={async () => {
            if (isSaving) return;
            await handleSave();
            router.replace('/(worker)/feed');
          }}
          disabled={isSaving}
        />
        <Button
          title="Logout"
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace('/auth/start');
          }}
        />
      </View>

      {/* kleine Zusammenfassung für Debug */}
      <View style={{ marginTop: spacing.sm }}>
        <Text style={{ color: colors.gray700, fontSize: 12 }}>
          {(profile?.selectedTags?.length ?? 0)} ausgewählte Qualifikationen und Tätigkeiten
        </Text>
      </View>
    </ScrollView>
  );
}