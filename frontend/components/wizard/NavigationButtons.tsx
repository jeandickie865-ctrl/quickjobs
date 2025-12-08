// components/wizard/NavigationButtons.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

const COLORS = {
  purple: '#EFABFF',
  purpleDark: '#3E2DD9',
  neon: '#EFABFF',
  white: '#FFFFFF',
  gray: '#999',
};

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onNext,
  nextLabel = 'Weiter',
  nextDisabled = false,
  loading = false,
  showBack = true,
}) => {
  return (
    <View style={styles.container}>
      {showBack && onBack && (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.purple} />
          <Text style={styles.backText}>Zurück</Text>
        </Pressable>
      )}

      {onNext && (
        <Pressable
          onPress={onNext}
          disabled={nextDisabled || loading}
          style={({ pressed }) => [
            styles.nextButton,
            nextDisabled && styles.nextButtonDisabled,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.purple} />
          ) : (
            <>
              <Text style={[styles.nextText, nextDisabled && styles.nextTextDisabled]}>
                {nextLabel}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={nextDisabled ? COLORS.gray : COLORS.purple}
              />
            </>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#0A0816',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.purple,
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.purple,
  },
  nextButton: {
    width: '60%',
    maxWidth: 300,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORS.neon,
    gap: 6,
    shadowColor: COLORS.neon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextTextDisabled: {
    color: COLORS.gray,
  },
});
