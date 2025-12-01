// app/(worker)/profile-wizard/step4-skills.tsx - SUBCATEGORIES & QUALIFICATIONS
import React, { useState, useEffect } from 'react';
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
  purpleDark: '#3E2DD9',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#999',
  lightGray: '#F5F5F5',
  error: '#FF4D4D',
};

export default function Step4Skills() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();
  
  const selectedCategories = wizardData.selectedCategories || [];
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    wizardData.selectedSubcategories || []
  );
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>(
    wizardData.selectedQualifications || []
  );
  
  // Get all subcategories and qualifications for selected categories
  const availableSubcategories: {key: string, label: string}[] = [];
  const availableQualifications: {key: string, label: string}[] = [];
  
  selectedCategories.forEach(catKey => {
    const category = TAXONOMY_DATA[catKey];
    if (category) {
      // Add subcategories
      category.subcategories?.forEach((sub: any) => {
        if (!availableSubcategories.find(s => s.key === sub.key)) {
          availableSubcategories.push({ key: sub.key, label: sub.label });
        }
      });
      // Add qualifications
      category.qualifications?.forEach((qual: any) => {
        if (!availableQualifications.find(q => q.key === qual.key)) {
          availableQualifications.push({ key: qual.key, label: qual.label });
        }
      });
    }
  });

  const toggleSubcategory = (key: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(key)
        ? prev.filter(s => s !== key)
        : [...prev, key]
    );
  };

  const toggleQualification = (key: string) => {
    setSelectedQualifications(prev => 
      prev.includes(key)
        ? prev.filter(q => q !== key)
        : [...prev, key]
    );
  };

  const handleNext = () => {
    if (selectedSubcategories.length > 0) {
      // Save to context
      updateWizardData({ 
        selectedSubcategories,
        selectedQualifications
      });
      router.push('/(worker)/profile-wizard/step5-summary');
    }
  };

  const handleBack = () => {
    updateWizardData({ 
      selectedSubcategories,
      selectedQualifications
    });
    router.push('/(worker)/profile-wizard/step3-categories');
  };

  const isFormValid = selectedSubcategories.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Progress */}
        <ProgressBar currentStep={4} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Tätigkeiten & Qualifikationen</Text>
          <Text style={styles.subtitle}>
            Wähle deine Tätigkeitsbereiche und Qualifikationen
          </Text>

          {availableSubcategories.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={48} color={COLORS.black} />
              <Text style={styles.emptyText}>
                Bitte wähle zuerst Kategorien aus.
              </Text>
            </View>
          )}

          {/* Subcategories (PFLICHT) */}
          {availableSubcategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tätigkeiten * (Pflicht)
              </Text>
              <Text style={styles.helperText}>
                Wähle mindestens eine Tätigkeit aus
              </Text>
              <View style={styles.itemsList}>
                {availableSubcategories.map((sub) => {
                  const isSelected = selectedSubcategories.includes(sub.key);
                  
                  return (
                    <Pressable
                      key={sub.key}
                      onPress={() => toggleSubcategory(sub.key)}
                      style={({ pressed }) => [
                        styles.itemCard,
                        isSelected && styles.itemCardSelected,
                        pressed && styles.itemCardPressed,
                      ]}
                    >
                      <Text style={[
                        styles.itemText,
                        isSelected && styles.itemTextSelected,
                      ]}>
                        {sub.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Qualifications (OPTIONAL) */}
          {availableQualifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Qualifikationen (Optional)
              </Text>
              <Text style={styles.helperText}>
                Wähle deine vorhandenen Qualifikationen
              </Text>
              <View style={styles.itemsList}>
                {availableQualifications.map((qual) => {
                  const isSelected = selectedQualifications.includes(qual.key);
                  
                  return (
                    <Pressable
                      key={qual.key}
                      onPress={() => toggleQualification(qual.key)}
                      style={({ pressed }) => [
                        styles.itemCard,
                        isSelected && styles.itemCardSelected,
                        pressed && styles.itemCardPressed,
                      ]}
                    >
                      <Text style={[
                        styles.itemText,
                        isSelected && styles.itemTextSelected,
                      ]}>
                        {qual.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Validation Hint */}
        {!isFormValid && availableSubcategories.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={styles.validationHint}>
              ℹ️ Bitte wähle mindestens eine Tätigkeit aus, um fortzufahren
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
    opacity: 1,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.8,
  },
  itemsList: {
    flexDirection: 'column',
    gap: 12,
  },
  itemCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ECE9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  itemCardSelected: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.neon,
    shadowColor: 'rgba(200,255,22,0.2)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  itemCardPressed: {
    opacity: 0.7,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  itemTextSelected: {
    color: COLORS.black,
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
