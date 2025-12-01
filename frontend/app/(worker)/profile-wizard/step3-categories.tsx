// app/(worker)/profile-wizard/step3-categories.tsx - KATEGORIEN
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';
import { TAXONOMY, getAllCategories, getCategoryLabel } from '../../../utils/taxonomy';

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

export default function Step3Categories() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    wizardData.selectedCategories || []
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length > 0) {
      // Save to context
      updateWizardData({ selectedCategories: selectedCategories as any });
      router.push('/(worker)/profile-wizard/step4-skills');
    }
  };

  const handleBack = () => {
    updateWizardData({ selectedCategories: selectedCategories as any });
    router.push('/(worker)/profile-wizard/step2-address');
  };

  const isFormValid = selectedCategories.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Progress */}
        <ProgressBar currentStep={3} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Fähigkeiten & Kategorien</Text>
          <Text style={styles.subtitle}>
            Wähle deine Hauptkategorien
          </Text>

          {/* Categories Grid */}
          <View style={styles.grid}>
            {getAllCategories().map((categoryKey) => {
              const isSelected = selectedCategories.includes(categoryKey);
              const categoryLabel = getCategoryLabel(categoryKey);
              
              return (
                <Pressable
                  key={categoryKey}
                  onPress={() => toggleCategory(categoryKey)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    pressed && styles.categoryCardPressed,
                  ]}
                >
                  <View style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}>
                    <Ionicons
                      name="briefcase"
                      size={32}
                      color={isSelected ? COLORS.purple : COLORS.white}
                    />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelSelected,
                  ]}>
                    {categoryLabel}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.neon} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Validation Hint */}
        {!isFormValid && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={styles.validationHint}>
              ℹ️ Bitte wähle mindestens eine Kategorie aus, um fortzufahren
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#ECE9FF',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
    margin: '2.5%',
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: '#C8FF16',
    borderColor: '#5941FF',
    borderWidth: 2,
    shadowColor: 'rgba(200,255,22,0.2)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  categoryCardPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    // Keine Änderung nötig
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5941FF',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#5941FF',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  validationHint: {
    fontSize: 13,
    color: '#C8FF16',
    backgroundColor: 'rgba(200, 255, 22, 0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
});
