// app/(worker)/profile-wizard/step3-categories.tsx – Quickjobs Accordion Design

import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';

const TAXONOMY_DATA = require('../../../shared/taxonomy.json');

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#9333EA',
  secondary: '#FF773D',
  accent: '#EFABFF',
  border: '#E9D5FF',
  text: '#1A1A1A',
  cardText: '#1A1A1A',
  textMuted: '#6B7280',
  inputBg: '#FFFFFF',
  inputBorder: '#E9D5FF',
  error: '#EF4444',
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#FFFFFF',
  muted: '#6B7280',
  gray: '#6B7280',
  placeholder: '#9CA3AF',
};

export default function Step3Categories() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(wizardData.categories || []);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(wizardData.subcategories || []);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>(wizardData.qualifications || []);
  const [errors, setErrors] = useState<{ category?: string; subcategories?: string }>({});
  
  // Track aktive Kategorie (für Chip-UI)
  const [activeCategory, setActiveCategory] = useState<string | null>(
    selectedCategories.length > 0 ? selectedCategories[0] : null
  );
  
  // Track ob Qualifikationen angezeigt werden
  const [showQualifications, setShowQualifications] = useState<boolean>(false);

  const handleCategoryToggle = (catKey: string) => {
    const isSelected = selectedCategories.includes(catKey);
    
    if (isSelected) {
      // Abwählen: Kategorie entfernen + zugehörige Tätigkeiten/Qualifikationen entfernen
      setSelectedCategories((prev) => prev.filter((k) => k !== catKey));

      const cat = TAXONOMY_DATA[catKey];
      const catSubs = cat.subcategories?.map((s: any) => s.key) || [];
      const catQuals = cat.qualifications?.map((q: any) => q.key) || [];
      
      setSelectedSubcategories((prev) => prev.filter((s) => !catSubs.includes(s)));
      setSelectedQualifications((prev) => prev.filter((q) => !catQuals.includes(q)));
      
      // Wenn die aktive Kategorie abgewählt wird, zur nächsten wechseln
      if (activeCategory === catKey) {
        const remaining = selectedCategories.filter(k => k !== catKey);
        setActiveCategory(remaining.length > 0 ? remaining[0] : null);
      }
    } else {
      // Auswählen: Kategorie hinzufügen + aktiv setzen
      setSelectedCategories((prev) => [...prev, catKey]);
      setActiveCategory(catKey);
      setShowQualifications(false); // Qualifikationen zurücksetzen
    }
    setErrors({});
  };

  const toggleSubcategory = (subKey: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subKey) ? prev.filter((s) => s !== subKey) : [...prev, subKey]
    );
    setErrors((prev) => ({ ...prev, subcategories: undefined }));
  };

  const toggleQualification = (qualKey: string) => {
    setSelectedQualifications((prev) =>
      prev.includes(qualKey) ? prev.filter((q) => q !== qualKey) : [...prev, qualKey]
    );
  };

  const handleNext = () => {
    const newErrors: { category?: string; subcategories?: string } = {};

    if (selectedCategories.length === 0) {
      newErrors.category = 'Bitte wähle mindestens eine Kategorie aus.';
    }

    if (selectedSubcategories.length === 0) {
      newErrors.subcategories = 'Bitte wähle mindestens eine Tätigkeit aus.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateWizardData({
      categories: selectedCategories,
      subcategories: selectedSubcategories,
      qualifications: selectedQualifications,
    });

    router.push('/(worker)/profile-wizard/step4-skills');
  };

  const handleBack = () => {
    updateWizardData({
      categories: selectedCategories,
      subcategories: selectedSubcategories,
      qualifications: selectedQualifications,
    });
    router.push('/(worker)/profile-wizard/step2-address');
  };

  const isFormValid =
    selectedCategories.length > 0 &&
    selectedSubcategories.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
        
          <ProgressBar currentStep={3} totalSteps={5} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ ...styles.scrollContent, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Kategorien & Tätigkeiten</Text>
            <Text style={styles.subtitle}>Wähle deine Bereiche aus</Text>

            {/* SCHRITT 1: KATEGORIEN ALS HORIZONTAL SCROLLABLE CHIPS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Wähle Kategorien *</Text>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {Object.entries(TAXONOMY_DATA).map(([key, cat]: [string, any]) => {
                  const isSelected = selectedCategories.includes(key);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleCategoryToggle(key)}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected
                      ]}
                    >
                      <Text style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected
                      ]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Ausgewählte Kategorien anzeigen */}
              {selectedCategories.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}>
                    Ausgewählt: {selectedCategories.map(k => TAXONOMY_DATA[k].label).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {/* SCHRITT 2: TÄTIGKEITEN FÜR AKTIVE KATEGORIE */}
            {selectedCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Wähle Tätigkeiten *</Text>
                {errors.subcategories && <Text style={styles.errorText}>{errors.subcategories}</Text>}
                
                {/* Tabs für ausgewählte Kategorien */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8, marginBottom: 12 }}
                >
                  {selectedCategories.map((catKey) => {
                    const cat = TAXONOMY_DATA[catKey];
                    const isActive = activeCategory === catKey;
                    const catSubs = cat.subcategories?.map((s: any) => s.key) || [];
                    const selectedCount = catSubs.filter((s: string) => selectedSubcategories.includes(s)).length;
                    
                    return (
                      <Pressable
                        key={catKey}
                        onPress={() => {
                          setActiveCategory(catKey);
                          setShowQualifications(false);
                        }}
                        style={[
                          styles.categoryTab,
                          isActive && styles.categoryTabActive
                        ]}
                      >
                        <Text style={[
                          styles.categoryTabText,
                          isActive && styles.categoryTabTextActive
                        ]}>
                          {cat.label}
                        </Text>
                        {selectedCount > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{selectedCount}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Tätigkeiten für aktive Kategorie */}
                {activeCategory && TAXONOMY_DATA[activeCategory] && (
                  <View>
                    {TAXONOMY_DATA[activeCategory].subcategories?.map((sub: any) => {
                      const isSubSelected = selectedSubcategories.includes(sub.key);
                      return (
                        <Pressable
                          key={sub.key}
                          onPress={() => toggleSubcategory(sub.key)}
                          style={[
                            styles.activityCard,
                            isSubSelected && styles.activityCardSelected
                          ]}
                        >
                          <Text style={[
                            styles.activityText,
                            isSubSelected && styles.activityTextSelected
                          ]}>
                            {sub.label}
                          </Text>
                          {isSubSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* SCHRITT 3: QUALIFIKATIONEN (OPTIONAL) */}
            {activeCategory && TAXONOMY_DATA[activeCategory]?.qualifications?.length > 0 && (
              <View style={styles.section}>
                <Pressable
                  onPress={() => setShowQualifications(!showQualifications)}
                  style={styles.qualificationToggle}
                >
                  <Text style={styles.sectionTitle}>3. Qualifikationen (optional)</Text>
                  <Ionicons 
                    name={showQualifications ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={COLORS.neon} 
                  />
                </Pressable>
                
                {showQualifications && (
                  <View style={{ marginTop: 12 }}>
                    {TAXONOMY_DATA[activeCategory].qualifications.map((qual: any) => {
                      const isQualSelected = selectedQualifications.includes(qual.key);
                      return (
                        <Pressable
                          key={qual.key}
                          onPress={() => toggleQualification(qual.key)}
                          style={[
                            styles.qualCard,
                            isQualSelected && styles.qualCardSelected
                          ]}
                        >
                          <Text style={[
                            styles.qualText,
                            isQualSelected && styles.qualTextSelected
                          ]}>
                            {qual.label}
                          </Text>
                          {isQualSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {!isFormValid && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={styles.validationHint}>
                Bitte wähle mindestens eine Kategorie und mindestens eine Tätigkeit aus.
              </Text>
            </View>
          )}

          <NavigationButtons
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={!isFormValid}
            showBack={true}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 28
  },

  section: {
    marginBottom: 32
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.neon,
    marginBottom: 12
  },

  // Chips (Kategorien horizontal)
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 10,
  },

  chipSelected: {
    backgroundColor: COLORS.neon,
    borderColor: COLORS.neon,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Category Tabs (für Tätigkeiten)
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  categoryTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  badge: {
    backgroundColor: COLORS.neon,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Activity Cards (Tätigkeiten)
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  activityCardSelected: {
    borderColor: COLORS.neon,
    backgroundColor: '#F5F0FF',
  },

  activityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },

  activityTextSelected: {
    color: COLORS.neon,
    fontWeight: '700',
  },

  // Qualifikationen Toggle
  qualificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Qualification Cards
  qualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qualCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: '#FFF5F0',
  },

  qualText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },

  qualificationTextSelected: {
    color: COLORS.secondary,
    fontWeight: '600',
  },

  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8
  },

  validationHint: {
    fontSize: 13,
    color: COLORS.error,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center'
  }
});
