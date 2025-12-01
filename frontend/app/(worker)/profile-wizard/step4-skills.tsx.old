// app/(worker)/profile-wizard/step4-skills.tsx - FÄHIGKEITEN
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';
import { getAllTagsForCategories } from '../../../utils/taxonomy';

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
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    wizardData.selectedSkills || []
  );
  
  // Get all tags (required + optional) for selected categories
  const availableTags = getAllTagsForCategories(selectedCategories);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleNext = () => {
    if (selectedSkills.length > 0) {
      // Save to context
      updateWizardData({ selectedSkills });
      router.push('/(worker)/profile-wizard/step5-summary');
    }
  };

  const handleBack = () => {
    updateWizardData({ selectedSkills });
    router.push('/(worker)/profile-wizard/step3-categories');
  };

  const isFormValid = selectedSkills.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Progress */}
        <ProgressBar currentStep={4} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Fähigkeiten & Qualifikationen</Text>
          <Text style={styles.subtitle}>
            Was kannst du besonders gut?
          </Text>
          <Text style={styles.helperText}>
            Wähle alle zutreffenden Fähigkeiten aus
          </Text>

          {availableTags.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={48} color={COLORS.white} />
              <Text style={styles.emptyText}>
                Keine Fähigkeiten verfügbar. Bitte wähle zuerst Kategorien aus.
              </Text>
            </View>
          )}

          {/* Skills/Tags List */}
          <View style={styles.skillsList}>
            {availableTags.map((tag, index) => {
              const isSelected = selectedSkills.includes(tag.value);
              
              return (
                <Pressable
                  key={index}
                  onPress={() => toggleSkill(tag.value)}
                  style={({ pressed }) => [
                    styles.skillChip,
                    isSelected && styles.skillChipSelected,
                    pressed && styles.skillChipPressed,
                  ]}
                >
                  <Text style={[
                    styles.skillText,
                    isSelected && styles.skillTextSelected,
                  ]}>
                    {tag.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.neon} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Validation Hint */}
        {!isFormValid && availableTags.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={styles.validationHint}>
              ℹ️ Bitte wähle mindestens eine Qualifikation aus, um fortzufahren
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
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 1,
    marginBottom: 24,
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
  skillsList: {
    flexDirection: 'column',
    gap: 12,
  },
  skillChip: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ECE9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  skillChipSelected: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.neon,
    shadowColor: 'rgba(200,255,22,0.2)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  skillChipPressed: {
    opacity: 0.7,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  skillTextSelected: {
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
