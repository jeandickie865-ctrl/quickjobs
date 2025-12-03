// components/LegalConfirmationModal.tsx - BACKUP NEON LEGAL MODAL (SAFE VERSION)
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Button } from './ui/Button';

const COLORS = {
  white: '#FFFFFF',
  purple: '#5941FF',
  neon: '#C8FF16',
  black: '#000000',
  gray100: '#F5F5F5',
  gray400: '#9CA3AF',
  gray600: '#6B7280',
  gray700: '#374151',
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

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
  const [accepted, setAccepted] = useState(false);

  // Reset checkbox when modal closes
  useEffect(() => {
    if (!visible) {
      setAccepted(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!accepted) return;
    
    // Close modal and call onConfirm after state update
    setAccepted(false);
    onConfirm();
  };

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
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.lg,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: SPACING.xl,
            width: '100%',
            maxWidth: 420,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
            borderWidth: 2,
            borderColor: COLORS.neon,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: COLORS.purple,
              marginBottom: SPACING.sm,
            }}
          >
            Rechtliche Hinweise
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: COLORS.gray600,
              marginBottom: SPACING.md,
            }}
          >
            Bitte lies dir diese Infos durch und bestätige sie, bevor du fortfährst.
          </Text>

          <ScrollView
            style={{ maxHeight: 280, marginBottom: SPACING.lg }}
            showsVerticalScrollIndicator={true}
          >
            <Text
              style={{
                fontSize: 14,
                color: COLORS.gray700,
                lineHeight: 22,
                marginBottom: SPACING.md,
              }}
            >
              1. Die Beschäftigung kommt direkt zwischen dir als Auftraggeber und dem Jobstarter zustande. BACKUP stellt den Kontakt her und erhält dafür eine Provision.
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.gray700,
                lineHeight: 22,
                marginBottom: SPACING.md,
              }}
            >
              2. Du bist selbst dafür verantwortlich, alle gesetzlichen Vorgaben einzuhalten. Dazu gehören je nach Modell zum Beispiel Steuern, Sozialabgaben und Meldungen an Stellen wie die Minijob-Zentrale.
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.gray700,
                lineHeight: 22,
                marginBottom: SPACING.md,
              }}
            >
              3. Der Lohn für den Jobstarter wird direkt von dir an den Jobstarter gezahlt. Die 20 Prozent Provision an BACKUP sind eine separate Zahlung für die erfolgreiche Vermittlung.
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.gray700,
                lineHeight: 22,
              }}
            >
              4. BACKUP übernimmt keine Arbeitgeberrolle und keine Haftung für Verstöße gegen arbeitsrechtliche oder steuerliche Pflichten.
            </Text>
          </ScrollView>

          {/* Checkbox / Bestätigung */}
          <Pressable
            onPress={() => setAccepted(prev => !prev)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: SPACING.lg,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: accepted ? COLORS.neon : COLORS.gray400,
                backgroundColor: accepted ? COLORS.neon : COLORS.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {accepted && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: COLORS.black,
                  }}
                />
              )}
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: COLORS.gray700,
                lineHeight: 20,
              }}
            >
              Ich habe die Hinweise gelesen und verstanden und bin damit einverstanden.
            </Text>
          </Pressable>

          {/* Buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <Pressable
              onPress={onCancel}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: COLORS.gray100,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: COLORS.gray700,
                }}
              >
                Abbrechen
              </Text>
            </Pressable>

            <Button
              title="Weiter"
              onPress={handleConfirm}
              disabled={!accepted}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
