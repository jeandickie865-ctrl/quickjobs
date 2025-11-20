// app/(worker)/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, ActivityIndicator } from 'react-native';
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

function createEmptyProfile(userId: string): WorkerProfile {
  return {
    userId,
    categories: [],
    selectedTags: [],
    radiusKm: DEFAULT_RADIUS_KM,
    homeAddress: {},  // Leeres Address-Objekt statt leerer String
    homeLat: undefined,  // Keine Dummy-Koordinaten
    homeLon: undefined,  // Nur echte Werte
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
    setIsSaving(true);
    try {
      // hier später Geocoding einbauen; vorerst dummy Lat/Lon wenn leer
      const cleaned: WorkerProfile = {
        ...profile,
        homeLat: profile.homeLat || 0,
        homeLon: profile.homeLon || 0
      };
      await saveWorkerProfile(cleaned);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.beige50 }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md }}
    >
      <Text style={{ color: colors.black, fontSize: 22, fontWeight: '800' }}>Dein Profil</Text>

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
          Beschreibe dich kurz. Dieser Text wird Arbeitgebern vor dem Match angezeigt.
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
            setProfile({ ...profile, homeLat: value });
          }}
          onLonChange={(value) => {
            setProfile({ ...profile, homeLon: value });
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
        <Text style={{ color: colors.black, fontWeight: '600' }}>Kategorien</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(c => (
            <Chip
              key={c.key}
              label={c.label}
              selected={selectedCategories.includes(c.key)}
              onPress={() => toggleCategory(c.key)}
            />
          ))}
        </View>
      </View>

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