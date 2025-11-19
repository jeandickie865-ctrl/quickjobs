import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import Chip from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { listCategories, getCategory, groupTagsByType, CategoryKey } from '../../src/taxonomy';
import { RADIUS_OPTIONS_KM, DEFAULT_RADIUS_KM } from '../../constants/radius';
import { getProfile, saveProfile } from '../../utils/profileStore';
import { WorkerProfile } from '../../types/profile';

export default function WorkerProfileScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [address, setAddress] = useState('');
  const [homeLat, setHomeLat] = useState(51.2277);
  const [homeLon, setHomeLon] = useState(6.7735);
  const [loading, setLoading] = useState(false);

  const categories = listCategories();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await getProfile();
    if (profile) {
      setSelectedCategories(new Set(profile.categories));
      setSelectedTags(new Set(profile.tags));
      setRadiusKm(profile.radiusKm);
      setHomeLat(profile.homeLat);
      setHomeLon(profile.homeLon);
    }
  };

  const toggleCategory = (key: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(key)) {
      newSet.delete(key);
      // Remove tags from this category
      const cat = getCategory(key as CategoryKey);
      const catTags = cat.tags.map(t => t.key);
      const newTags = new Set(selectedTags);
      catTags.forEach(tag => newTags.delete(tag));
      setSelectedTags(newTags);
    } else {
      newSet.add(key);
    }
    setSelectedCategories(newSet);
  };

  const toggleTag = (tagKey: string) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(tagKey)) {
      newSet.delete(tagKey);
    } else {
      newSet.add(tagKey);
    }
    setSelectedTags(newSet);
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Fehler', 'Benutzer nicht gefunden');
      return;
    }

    if (selectedCategories.size === 0) {
      Alert.alert('Fehler', 'Bitte wählen Sie mindestens eine Kategorie');
      return;
    }

    setLoading(true);
    try {
      const profile: WorkerProfile = {
        userId: user.id,
        categories: Array.from(selectedCategories).sort(),
        tags: Array.from(selectedTags).sort(),
        radiusKm,
        homeLat,
        homeLon,
      };

      await saveProfile(profile);
      Alert.alert('Erfolg', 'Profil gespeichert!');
    } catch (error) {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.black, marginBottom: spacing.lg }}>
          Mein Profil
        </Text>

        {/* Categories */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
            Kategorien
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {categories.map(cat => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={selectedCategories.has(cat.key)}
                onPress={() => toggleCategory(cat.key)}
              />
            ))}
          </View>
        </View>

        {/* Tags per Category */}
        {Array.from(selectedCategories).map(catKey => {
          const category = getCategory(catKey as CategoryKey);
          const groups = groupTagsByType(catKey as CategoryKey);

          return (
            <View key={catKey} style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
                {category.label} - Qualifikationen
              </Text>

              {/* Rollen */}
              {groups.role.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Rollen
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.role.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Qualifikationen */}
              {groups.qual.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Qualifikationen
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.qual.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Lizenzen */}
              {groups.license.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Lizenzen
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.license.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Dokumente */}
              {groups.doc.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Dokumente
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.doc.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Skills */}
              {groups.skill.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Skills
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.skill.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Werkzeuge */}
              {groups.tool.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Werkzeuge
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.tool.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Fahrzeuge */}
              {groups.vehicle.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray700, marginBottom: spacing.xs }}>
                    Fahrzeuge
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {groups.vehicle.map(tag => (
                      <Chip
                        key={tag.key}
                        label={tag.label}
                        selected={selectedTags.has(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Radius */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
            Suchradius
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {RADIUS_OPTIONS_KM.map(radius => (
              <Pressable
                key={radius}
                onPress={() => setRadiusKm(radius)}
                style={{
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.md,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: radiusKm === radius ? colors.black : colors.gray200,
                  backgroundColor: radiusKm === radius ? colors.black : colors.beige50,
                }}
              >
                <Text style={{ color: radiusKm === radius ? colors.white : colors.black, fontWeight: '600' }}>
                  {radius} km
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Address */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
            Standort
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Adresse eingeben (Geocoding folgt)"
            placeholderTextColor={colors.gray400}
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              padding: spacing.md,
              fontSize: 16,
              color: colors.black,
              backgroundColor: colors.white,
            }}
          />
          <Text style={{ fontSize: 12, color: colors.gray400, marginTop: spacing.xs }}>
            Aktuell: {homeLat.toFixed(4)}, {homeLon.toFixed(4)} (Düsseldorf Eller Demo)
          </Text>
        </View>

        {/* Save Button */}
        <Button
          title="Profil speichern"
          onPress={handleSave}
          loading={loading}
          disabled={loading || selectedCategories.size === 0}
        />

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
