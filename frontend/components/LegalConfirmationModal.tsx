import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';

interface LegalConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  workerName: string;
}

export function LegalConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  workerName,
}: LegalConfirmationModalProps) {
  const { colors, spacing } = useTheme();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
      setConfirmed(false); // Reset for next time
    }
  };

  const handleCancel = () => {
    setConfirmed(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: spacing.xl,
            maxWidth: 500,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Header */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: colors.black,
              marginBottom: spacing.md,
              textAlign: 'center',
            }}
          >
            ⚠️ Rechtlicher Hinweis
          </Text>

          {/* Content */}
          <ScrollView
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ gap: spacing.md }}
          >
            <View
              style={{
                backgroundColor: colors.warningLight,
                padding: spacing.md,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.warning,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: colors.gray900,
                  lineHeight: 22,
                }}
              >
                Du bist dabei, <Text style={{ fontWeight: '700' }}>{workerName}</Text> für
                diesen Job auszuwählen.
              </Text>
            </View>

            <Text
              style={{
                fontSize: 15,
                color: colors.gray700,
                lineHeight: 24,
              }}
            >
              <Text style={{ fontWeight: '700' }}>Bitte beachte:</Text> Als kurzfristig
              beschäftigte Aushilfe bist du für die steuerliche Behandlung deiner Einnahmen
              selbst verantwortlich.
              {'\n\n'}
              Stelle sicher, dass du die relevanten steuerlichen und sozialversicherungsrechtlichen
              Pflichten kennst und erfüllst.
              {'\n\n'}
              <Text style={{ fontStyle: 'italic', color: colors.gray600 }}>
                Diese Information ersetzt keine steuerliche oder rechtliche Beratung.
              </Text>
            </Text>

            {/* Checkbox */}
            <Pressable
              onPress={() => setConfirmed(!confirmed)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.sm,
                backgroundColor: confirmed ? colors.successLight : colors.gray100,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: confirmed ? colors.success : colors.gray300,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: confirmed ? colors.success : colors.white,
                  borderWidth: 2,
                  borderColor: confirmed ? colors.success : colors.gray400,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {confirmed && (
                  <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
                    ✓
                  </Text>
                )}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.black,
                  fontWeight: '600',
                }}
              >
                Ich habe dies verstanden und bestätige die Auswahl.
              </Text>
            </Pressable>
          </ScrollView>

          {/* Actions */}
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              title="Kandidat auswählen"
              onPress={handleConfirm}
              disabled={!confirmed}
              variant="primary"
            />
            <Button
              title="Abbrechen"
              onPress={handleCancel}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
