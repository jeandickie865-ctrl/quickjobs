// app/auth/start.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';

export default function RoleSelection() {
  const { colors } = useTheme();
  const { setRole } = useAuth();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);

  const handleRoleSelect = async (role: 'worker' | 'employer') => {
    if (selecting) return;
    setSelecting(true);
    try {
      await setRole(role);
      if (role === 'worker') {
        router.replace('/(worker)/feed');
      } else {
        router.replace('/(employer)');
      }
    } catch (error) {
      console.error('Role selection error:', error);
    } finally {
      setSelecting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={[styles.title, { color: colors.text }]}>Wähle deine Rolle</Text>
        <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7, marginBottom: 40 }]}>
          Du kannst dies später in den Einstellungen ändern.
        </Text>

        <Pressable
          onPress={() => handleRoleSelect('worker')}
          disabled={selecting}
          style={[styles.button, { backgroundColor: colors.neon }]}
        >
          <Text style={[styles.buttonText, { color: colors.black }]}>Worker</Text>
        </Pressable>

        <Pressable
          onPress={() => handleRoleSelect('employer')}
          disabled={selecting}
          style={[styles.button, { backgroundColor: colors.neon, marginTop: 16 }]}
        >
          <Text style={[styles.buttonText, { color: colors.black }]}>Employer</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center' },
  button: { paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
