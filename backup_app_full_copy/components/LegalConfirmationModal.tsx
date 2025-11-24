// components/LegalConfirmationModal.tsx - Green Modern Minimal
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';

interface LegalConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LegalConfirmationModal({
  visible,
  onConfirm,
  onCancel,
}: LegalConfirmationModalProps) {
  const { colors, spacing } = useTheme();
  const [accepted, setAccepted] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 20,
            padding: spacing.xl,
            width: '100%',
            maxWidth: 400,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: colors.black,
              marginBottom: spacing.md,
            }}
          >
            Bevor du fortfährst
          </Text>

          <ScrollView style={{ maxHeight: 300, marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: 15,
                color: colors.gray600,
                lineHeight: 22,
                marginBottom: spacing.md,
              }}
            >
              Bitte bestätige, dass du die Hinweise zu Steuern und Abgaben gelesen hast.
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.gray600,
                lineHeight: 22,
              }}
            >
              Die Beschäftigung findet eigenverantwortlich zwischen Auftraggeber und Jobstarter statt.
              Du bist für die korrekte Abführung von Steuern und Sozialabgaben verantwortlich.
            </Text>
          </ScrollView>

          <Pressable
            onPress={() => setAccepted(!accepted)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: accepted ? colors.primary : colors.gray300,
                backgroundColor: accepted ? colors.primary : colors.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {accepted && (
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>
                  ✓
                </Text>
              )}
            </View>
            <Text style={{ color: colors.black, fontSize: 15, flex: 1 }}>
              Gelesen & akzeptiert
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              title="Abbrechen"
              variant="ghost"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <Button
              title="Weiter"
              onPress={onConfirm}
              disabled={!accepted}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
