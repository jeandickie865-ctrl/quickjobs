// components/wizard/ProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const COLORS = {
  purple: '#6A3FFF',
  neon: '#6A3FFF',
  white: '#1A1A1A',
  lightGray: '#E0E0E0',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.text}>
        Schritt {currentStep} von {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  barContainer: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.neon,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
    textAlign: 'center',
  },
});
