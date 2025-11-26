// app/(worker)/profile-wizard/step3-categories.tsx - KATEGORIEN
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { CATEGORY_MAPPING } from '../../../utils/categoryMapping';

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length > 0) {
      // Store in context/AsyncStorage
      router.push('/(worker)/profile-wizard/step4-skills');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = selectedCategories.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Progress */}
        <ProgressBar currentStep={3} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Kategorien</Text>
          <Text style={styles.subtitle}>
            In welchen Bereichen bist du tätig?
          </Text>
          <Text style={styles.helperText}>
            Wähle mindestens eine Kategorie aus (Mehrfachauswahl möglich)
          </Text>

          {/* Categories Grid */}
          <View style={styles.grid}>
            {Object.keys(CATEGORY_MAPPING).map((category) => {
              const isSelected = selectedCategories.includes(category);
              const categoryData = CATEGORY_MAPPING[category];
              
              return (
                <Pressable
                  key={category}
                  onPress={() => toggleCategory(category)}
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
                      name={categoryData.icon as any}
                      size={32}
                      color={isSelected ? COLORS.purple : COLORS.white}
                    />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelSelected,
                  ]}>
                    {categoryData.label}
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
    backgroundColor: COLORS.purple,
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
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.neon,
  },
  categoryCardPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.neon,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: COLORS.purple,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
