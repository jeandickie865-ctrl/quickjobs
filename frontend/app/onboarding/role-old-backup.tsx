// app/onboarding/role.tsx - Überarbeitet: Arbeitskraft & Auftraggeber
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Briefcase, UserCheck } from '../../components/Icons';

type Role = 'employer' | 'worker';

export default function RoleSelectionScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      // Rolle wird vom Backend via /auth/me verwaltet
      // Hier nur Navigation zur Startseite
      router.replace('/start');
    } catch (error) {
      console.error('Fehler beim Navigieren:', error);
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ 
    role, 
    title, 
    description, 
    icon 
  }: { 
    role: Role; 
    title: string; 
    description: string; 
    icon: 'employer' | 'worker' 
  }) => {
    const isSelected = selectedRole === role;

    return (
      <Pressable
        onPress={() => setSelectedRole(role)}
        style={[
          styles.card,
          {
            backgroundColor: colors.white,
            borderColor: isSelected ? colors.primary : colors.gray300,
            borderWidth: isSelected ? 3 : 2,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
            shadowOpacity: isSelected ? 0.15 : 0.08,
            shadowRadius: isSelected ? 6 : 3,
            elevation: isSelected ? 4 : 2,
          }
        ]}
      >
        <View style={{ marginBottom: spacing.md, alignItems: 'center' }}>
          {icon === 'employer' ? (
            <Briefcase size={48} color={isSelected ? colors.primary : colors.gray600} />
          ) : (
            <UserCheck size={48} color={isSelected ? colors.primary : colors.gray600} />
          )}
        </View>

        <Text style={[
          styles.cardTitle,
          { color: colors.black, marginBottom: spacing.sm, textAlign: 'center' }
        ]}>
          {title}
        </Text>

        <Text style={[
          styles.cardDescription,
          { color: colors.gray600, textAlign: 'center' }
        ]}>
          {description}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
        <Text style={[
          styles.title,
          { color: colors.black, marginBottom: spacing.md, textAlign: 'center' }
        ]}>
          Wie möchtest du die App nutzen?
        </Text>

        <Text style={[
          styles.subtitle,
          { color: colors.gray600, marginBottom: spacing.xxl, textAlign: 'center' }
        ]}>
          Du kannst später zwischen den Rollen wechseln.
        </Text>

        <View style={{ gap: spacing.lg }}>
          <RoleCard
            role="worker"
            title="Arbeitskraft"
            description="Finde Aufträge in deiner Nähe und verdiene Geld."
            icon="worker"
          />

          <RoleCard
            role="employer"
            title="Auftraggeber"
            description="Erstelle Aufträge und finde schnelle Hilfe – privat oder geschäftlich."
            icon="employer"
          />
        </View>

        <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
          <Button
            title={loading ? 'Lädt...' : 'Weiter'}
            onPress={handleContinue}
            disabled={!selectedRole || loading}
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
});
