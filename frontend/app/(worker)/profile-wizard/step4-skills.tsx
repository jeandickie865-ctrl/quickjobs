// app/(worker)/profile-wizard/step4-skills.tsx - Quickjobs D+ DESIGN
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


export default function Step4Skills() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();

  const selectedCategories = wizardData.categories || [];
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>(
    wizardData.qualifications || []
  );

  const availableQualifications: { key: string; label: string }[] = [];
  selectedCategories.forEach(catKey => {
    const category = TAXONOMY_DATA[catKey];
    if (category) {
      category.qualifications?.forEach((qual: any) => {
        if (!availableQualifications.find(q => q.key === qual.key)) {
          availableQualifications.push({ key: qual.key, label: qual.label });
        }
      });
    }
  });

  const toggleQualification = (key: string) => {
    setSelectedQualifications(prev => {
      if (prev.includes(key)) {
        return prev.filter(q => q !== key);
      }
      return [...prev, key];
    });
  };

  const handleNext = () => {
    updateWizardData({
      qualifications: selectedQualifications,
    });
    router.push('/(worker)/profile-wizard/step5-summary');
  };

  const handleBack = () => {
    updateWizardData({
      qualifications: selectedQualifications,
    });
    router.push('/(worker)/profile-wizard/step3-categories');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <AppHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>

          <ProgressBar currentStep={4} totalSteps={5} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ ...styles.scrollContent, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
          >
            
            <Text style={styles.title}>Qualifikationen</Text>
            <Text style={styles.subtitle}>Welche Qualifikationen hast du?</Text>

            {selectedCategories.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle" size={48} color={COLORS.neon} />
                <Text style={styles.emptyText}>Bitte wähle zuerst mindestens eine Kategorie in Schritt 3 aus.</Text>
              </View>
            )}

            {availableQualifications.length === 0 && selectedCategories.length > 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.neon} />
                <Text style={styles.emptyText}>Für diese Kategorie gibt es keine Qualifikationen.</Text>
              </View>
            )}

            {availableQualifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Wähle alle passenden Qualifikationen</Text>

                <View style={styles.itemsList}>
                  {availableQualifications.map(qual => {
                    const isSelected = selectedQualifications.includes(qual.key);
                    return (
                      <Pressable
                        key={qual.key}
                        onPress={() => toggleQualification(qual.key)}
                        style={[
                          styles.itemCard,
                          isSelected && styles.itemCardSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.itemText,
                            isSelected && styles.itemTextSelected
                          ]}
                        >
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

          <NavigationButtons
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={false}
            showBack={true}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24 },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 28,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: 14,
    fontSize: 15,
    textAlign: 'center',
  },

  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.neon,
    marginBottom: 16,
  },

  itemsList: { flexDirection: 'column', gap: 12 },

  itemCard: {
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
  itemCardSelected: {
    borderColor: COLORS.neon,
    backgroundColor: '#1A172A',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemTextSelected: {
    color: COLORS.neon,
  },
});
