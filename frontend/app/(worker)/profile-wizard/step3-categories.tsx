// app/(worker)/profile-wizard/step3-categories.tsx - SELECT ONE CATEGORY + SUBCATEGORIES
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';

const TAXONOMY_DATA = require('../../../shared/taxonomy.json');

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#999',
  lightGray: '#F5F5F5',
  error: '#FF4D4D',
};

export default function Step3Categories() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(wizardData.categories || []);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    wizardData.subcategories || []
  );
  const [errors, setErrors] = useState<{ category?: string; subcategories?: string }>({});

  // Get subcategories for ALL selected categories
  const availableSubcategories: {key: string, label: string}[] = [];
  selectedCategories.forEach(catKey => {
    const category = TAXONOMY_DATA[catKey];
    if (category) {
      category.subcategories?.forEach((sub: any) => {
        if (!availableSubcategories.find(s => s.key === sub.key)) {
          availableSubcategories.push({ key: sub.key, label: sub.label });
        }
      });
    }
  });

  const handleCategoryToggle = (catKey: string) => {
    const isSelected = selectedCategories.includes(catKey);
    if (isSelected) {
      setSelectedCategories(prev => prev.filter(k => k !== catKey));
      // Remove subcategories from unselected category
      const cat = TAXONOMY_DATA[catKey];
      const categorySubcats = cat.subcategories?.map((s: any) => s.key) || [];
      setSelectedSubcategories(prev => prev.filter(sub => !categorySubcats.includes(sub)));
    } else {
      setSelectedCategories(prev => [...prev, catKey]);
    }
    setErrors({});
  };

  const toggleSubcategory = (subKey: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(subKey)
        ? prev.filter(s => s !== subKey)
        : [...prev, subKey]
    );
    setErrors({ ...errors, subcategories: undefined });
  };

  const handleNext = () => {
    const newErrors: { category?: string; subcategories?: string } = {};
    
    if (selectedCategories.length === 0) {
      newErrors.category = 'Bitte wähle mindestens eine Kategorie';
    }
    if (selectedSubcategories.length === 0) {
      newErrors.subcategories = 'Bitte wähle mindestens eine Tätigkeit';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save to context
    updateWizardData({
      categories: selectedCategories,
      subcategories: selectedSubcategories,
    });
    
    router.push('/(worker)/profile-wizard/step4-skills');
  };

  const handleBack = () => {
    updateWizardData({
      categories: selectedCategories,
      subcategories: selectedSubcategories,
    });
    router.push('/(worker)/profile-wizard/step2-location');
  };

  const isFormValid = selectedCategories.length > 0 && selectedSubcategories.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Progress */}
        <ProgressBar currentStep={3} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Kategorien & Tätigkeiten</Text>
          <Text style={styles.subtitle}>
            Wähle deine Kategorien und Tätigkeiten
          </Text>

          {/* SECTION 1: Select Multiple Categories */}
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
                    style={({ pressed }) => [
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* SECTION 2: Select Subcategories (only if categories selected) */}
          {selectedCategories.length > 0 && availableSubcategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Tätigkeiten auswählen *</Text>
              <Text style={styles.helperText}>
                Wähle mindestens eine Tätigkeit aus
              </Text>
              
              <View style={styles.subcategoriesList}>
                {availableSubcategories.map((sub: any) => {
                  const subKey = sub.key;
                  const subLabel = sub.label;
                  const isSelected = selectedSubcategories.includes(subKey);
                  
                  return (
                    <Pressable
                      key={subKey}
                      onPress={() => toggleSubcategory(subKey)}
                      style={({ pressed }) => [
                        styles.subcategoryCard,
                        isSelected && styles.subcategoryCardSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[
                        styles.subcategoryText,
                        isSelected && styles.subcategoryTextSelected,
                      ]}>
                        {subLabel}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />
                      )}
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

        {/* Validation Hint */}
        {!isFormValid && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={styles.validationHint}>
              ℹ️ Bitte wähle eine Kategorie und mindestens eine Tätigkeit
            </Text>
          </View>
        )}

        {/* Navigation */}
        <NavigationButtons
          onNext={handleNext}
          onBack={handleBack}
          nextDisabled={!isFormValid}
          showBack={true}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.black,
    opacity: 0.8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.purple,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ECE9FF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardSelected: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.neon,
    shadowColor: 'rgba(200,255,22,0.2)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: COLORS.black,
  },
  subcategoriesList: {
    flexDirection: 'column',
    gap: 12,
  },
  subcategoryCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ECE9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  subcategoryCardSelected: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.neon,
    shadowColor: 'rgba(200,255,22,0.2)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  subcategoryTextSelected: {
    color: COLORS.black,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8,
  },
  validationHint: {
    fontSize: 13,
    color: COLORS.neon,
    backgroundColor: 'rgba(200, 255, 22, 0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
});
