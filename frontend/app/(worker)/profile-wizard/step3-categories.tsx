// app/(worker)/profile-wizard/step3-categories.tsx – BACKUP STYLE D+ (dark premium)

import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';

const TAXONOMY_DATA = require('../../../shared/taxonomy.json');

// D+ PREMIUM COLORS
const COLORS = {
  bg: '#00A07C',
  card: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.05)',
  white: '#FFFFFF',
  cardText: "#00A07C",
  whiteMuted: 'rgba(255,255,255,0.85)',
  gray: 'rgba(255,255,255,0.55)',
  neon: '#EFABFF',
  purple: '#EFABFF',
  purpleLight: '#EFABFF',
  error: '#EFABFF'
};

export default function Step3Categories() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(wizardData.categories || []);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(wizardData.subcategories || []);
  const [errors, setErrors] = useState<{ category?: string; subcategories?: string }>({});

  // Build available subcategories
  const availableSubcategories: { key: string; label: string }[] = [];
  selectedCategories.forEach((catKey) => {
    const category = TAXONOMY_DATA[catKey];
    if (category) {
      category.subcategories?.forEach((sub: any) => {
        if (!availableSubcategories.find((s) => s.key === sub.key)) {
          availableSubcategories.push({ key: sub.key, label: sub.label });
        }
      });
    }
  });

  const handleCategoryToggle = (catKey: string) => {
    const isSelected = selectedCategories.includes(catKey);
    if (isSelected) {
      setSelectedCategories((prev) => prev.filter((k) => k !== catKey));

      const cat = TAXONOMY_DATA[catKey];
      const catSubs = cat.subcategories?.map((s: any) => s.key) || [];
      setSelectedSubcategories((prev) => prev.filter((s) => !catSubs.includes(s)));
    } else {
      setSelectedCategories((prev) => [...prev, catKey]);
    }
    setErrors({});
  };

  const toggleSubcategory = (subKey: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subKey) ? prev.filter((s) => s !== subKey) : [...prev, subKey]
    );
    setErrors((prev) => ({ ...prev, subcategories: undefined }));
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
    });

    router.push('/(worker)/profile-wizard/step4-skills');
  };

  const handleBack = () => {
    updateWizardData({
      categories: selectedCategories,
      subcategories: selectedSubcategories
    });
    router.push('/(worker)/profile-wizard/step2-address');
  };

  const isFormValid =
    selectedCategories.length > 0 &&
    selectedSubcategories.length > 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
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
            <Text style={styles.subtitle}>Wähle deine Kategorien und Tätigkeiten</Text>

            {/* CATEGORY SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Kategorien auswählen *</Text>
              <Text style={styles.helperText}>Wähle eine oder mehrere Kategorien</Text>

              <View style={styles.categoriesGrid}>
                {Object.entries(TAXONOMY_DATA).map(([key, cat]: [string, any]) => {
                  const isSelected = selectedCategories.includes(key);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleCategoryToggle(key)}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextSelected
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* SUBCATEGORY SECTION */}
            {selectedCategories.length > 0 && availableSubcategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Tätigkeiten auswählen *</Text>
                <Text style={styles.helperText}>Wähle mindestens eine Tätigkeit aus</Text>

                <View style={styles.subcategoriesList}>
                  {availableSubcategories.map((sub: any) => {
                    const isSelected = selectedSubcategories.includes(sub.key);
                    return (
                      <Pressable
                        key={sub.key}
                        onPress={() => toggleSubcategory(sub.key)}
                        style={[
                          styles.subcategoryCard,
                          isSelected && styles.subcategoryCardSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.subcategoryText,
                            isSelected && styles.subcategoryTextSelected
                          ]}
                        >
                          {sub.label}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />}
                      </Pressable>
                    );
                  })}
                </View>

                {errors.subcategories && (
                  <Text style={styles.errorText}>{errors.subcategories}</Text>
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
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 8
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.whiteMuted,
    marginBottom: 28
  },

  section: {
    marginBottom: 32
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.neon,
    marginBottom: 8
  },

  helperText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 16
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 12,
    rowGap: 12,
  },

  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },

  categoryCardSelected: {
    borderColor: COLORS.neon,
    backgroundColor: '#1A172B',
    shadowColor: COLORS.neon,
    shadowOpacity: 0.25,
    shadowRadius: 6
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white
  },

  categoryTextSelected: { color: COLORS.neon },

  subcategoriesList: { flexDirection: 'column', gap: 12 },

  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  subcategoryCardSelected: {
    borderColor: COLORS.neon,
    backgroundColor: '#1A172B',
    shadowColor: COLORS.neon,
    shadowOpacity: 0.25,
    shadowRadius: 6
  },

  subcategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white
  },

  subcategoryTextSelected: {
    color: COLORS.neon
  },

  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8
  },

  validationHint: {
    fontSize: 13,
    color: COLORS.neon,
    backgroundColor: 'rgba(200,255,22,0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center'
  }
});
