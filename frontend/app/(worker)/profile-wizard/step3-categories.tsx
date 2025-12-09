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
  
  // Track welche Kategorie geöffnet ist (Accordion)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    selectedCategories.length > 0 ? selectedCategories[0] : null
  );
  
  // Track welche Kategorie ihre Qualifikationen zeigt
  const [showQualificationsFor, setShowQualificationsFor] = useState<string | null>(null);

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
      
      // Wenn die geöffnete Kategorie abgewählt wird, schließen
      if (expandedCategory === catKey) {
        setExpandedCategory(null);
      }
      if (showQualificationsFor === catKey) {
        setShowQualificationsFor(null);
      }
    } else {
      // Auswählen: Kategorie hinzufügen + Accordion öffnen
      setSelectedCategories((prev) => [...prev, catKey]);
      setExpandedCategory(catKey); // Automatisch öffnen
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
            <Text style={styles.subtitle}>Wähle deine Kategorien und öffne sie, um Tätigkeiten auszuwählen</Text>

            {/* KATEGORIEN LISTE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kategorien *</Text>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

              {Object.entries(TAXONOMY_DATA).map(([key, cat]: [string, any]) => {
                const isSelected = selectedCategories.includes(key);
                const isExpanded = expandedCategory === key;
                const showQuals = showQualificationsFor === key;
                
                // Zähle ausgewählte Tätigkeiten für diese Kategorie
                const catSubs = cat.subcategories?.map((s: any) => s.key) || [];
                const selectedCount = catSubs.filter((s: string) => selectedSubcategories.includes(s)).length;

                return (
                  <View key={key} style={{ marginBottom: 12 }}>
                    {/* KATEGORIE CARD */}
                    <Pressable
                      onPress={() => handleCategoryToggle(key)}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextSelected
                        ]}>
                          {cat.label}
                        </Text>
                        {isSelected && selectedCount > 0 && (
                          <Text style={{ fontSize: 12, color: COLORS.neon, marginTop: 4 }}>
                            {selectedCount} Tätigkeit{selectedCount !== 1 ? 'en' : ''} ausgewählt
                          </Text>
                        )}
                      </View>
                      
                      {isSelected && (
                        <Pressable 
                          onPress={(e) => {
                            e.stopPropagation();
                            setExpandedCategory(isExpanded ? null : key);
                          }}
                          style={{ padding: 8 }}
                        >
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={24} 
                            color={COLORS.neon} 
                          />
                        </Pressable>
                      )}
                    </Pressable>

                    {/* ACCORDION: TÄTIGKEITEN */}
                    {isSelected && isExpanded && (
                      <View style={styles.accordionContent}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
                          Tätigkeiten:
                        </Text>

                        {cat.subcategories?.map((sub: any) => {
                          const isSubSelected = selectedSubcategories.includes(sub.key);
                          return (
                            <Pressable
                              key={sub.key}
                              onPress={() => toggleSubcategory(sub.key)}
                              style={[
                                styles.subcategoryCard,
                                isSubSelected && styles.subcategoryCardSelected
                              ]}
                            >
                              <Text
                                style={[
                                  styles.subcategoryText,
                                  isSubSelected && styles.subcategoryTextSelected
                                ]}
                              >
                                {sub.label}
                              </Text>
                              {isSubSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />}
                            </Pressable>
                          );
                        })}

                        {errors.subcategories && (
                          <Text style={styles.errorText}>{errors.subcategories}</Text>
                        )}

                        {/* QUALIFIKATIONEN BUTTON */}
                        {cat.qualifications && cat.qualifications.length > 0 && (
                          <View style={{ marginTop: 16 }}>
                            <Pressable
                              onPress={() => setShowQualificationsFor(showQuals ? null : key)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: COLORS.card,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                              }}
                            >
                              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
                                Qualifikationen {showQuals ? 'ausblenden' : 'anzeigen'}
                              </Text>
                              <Ionicons 
                                name={showQuals ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color={COLORS.neon} 
                              />
                            </Pressable>

                            {/* QUALIFIKATIONEN LISTE */}
                            {showQuals && (
                              <View style={{ marginTop: 12, gap: 10 }}>
                                {cat.qualifications.map((qual: any) => {
                                  const isQualSelected = selectedQualifications.includes(qual.key);
                                  return (
                                    <Pressable
                                      key={qual.key}
                                      onPress={() => toggleQualification(qual.key)}
                                      style={[
                                        styles.qualificationCard,
                                        isQualSelected && styles.qualificationCardSelected
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.qualificationText,
                                          isQualSelected && styles.qualificationTextSelected
                                        ]}
                                      >
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
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
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

  // Kategorie Card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  categoryCardSelected: {
    borderColor: COLORS.neon,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.neon,
    shadowOpacity: 0.25,
    shadowRadius: 6
  },

  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },

  categoryTextSelected: { 
    color: COLORS.neon,
    fontWeight: '700',
  },

  // Accordion Content
  accordionContent: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Tätigkeit Card
  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  subcategoryCardSelected: {
    borderColor: COLORS.neon,
    backgroundColor: COLORS.card,
  },

  subcategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },

  subcategoryTextSelected: {
    color: COLORS.neon
  },

  // Qualifikation Card
  qualificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qualificationCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.card,
  },

  qualificationText: {
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
