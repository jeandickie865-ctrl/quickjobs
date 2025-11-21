// app/onboarding/role.tsx - Green Modern Minimal (Auftraggeber/Jobstarter)
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
  const { setRole } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      await setRole(selectedRole);
      router.replace('/start');
    } catch (error) {
      console.error('Fehler beim Setzen der Rolle:', error);
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
            backgroundColor: isSelected ? colors.primaryLight : colors.white,
            borderColor: isSelected ? colors.primary : colors.gray300,
            borderWidth: 2,
          }
        ]}
      >
        <View style={{ marginBottom: spacing.md }}>
          {icon === 'employer' ? (
            <Briefcase size={36} color={isSelected ? colors.primary : colors.gray600} />
          ) : (
            <UserCheck size={36} color={isSelected ? colors.primary : colors.gray600} />
          )}
        </View>

        <Text style={[
          styles.cardTitle,
          { color: colors.black, marginBottom: spacing.sm }
        ]}>
          {title}
        </Text>

        <Text style={[
          styles.cardDescription,
          { color: colors.gray600 }
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
          { color: colors.black, marginBottom: spacing.md }
        ]}>
          Wähle deine Rolle
        </Text>

        <Text style={[
          styles.subtitle,
          { color: colors.gray600, marginBottom: spacing.xxl }
        ]}>
          Du kannst später zwischen den Rollen wechseln.
        </Text>

        <RoleCard
          role="employer"
          title="Auftraggeber"
          description="Erstelle Aufträge und finde schnelle Hilfe – privat oder geschäftlich."
          icon="employer"
        />

        <RoleCard
          role="worker"
          title="Jobstarter"
          description="Finde schnelle Aufträge in deiner Nähe und starte direkt."
          icon="worker"
        />

        <View style={{ marginTop: 'auto' }}>
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
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
