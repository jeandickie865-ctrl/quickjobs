// app/auth/role-select.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = {
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#FFFFFF',
  black: '#000000',
};

export default function RoleSelection() {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);

  const handleRoleSelect = async (role: 'worker' | 'employer') => {
    if (selecting) return;
    setSelecting(true);
    try {
      // Rolle wird vom Backend via /auth/me verwaltet
      // Hier nur Navigation basierend auf gewählter Rolle
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
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.white, marginBottom: 12, textAlign: 'center' }}>Wähle deine Rolle</Text>
        <Text style={{ fontSize: 16, color: COLORS.white, opacity: 0.8, marginBottom: 60, textAlign: 'center' }}>Du kannst dies später in den Einstellungen ändern.</Text>

        <Pressable onPress={() => handleRoleSelect('worker')} disabled={selecting} style={({ pressed }) => ({ backgroundColor: COLORS.neon, paddingVertical: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16, opacity: pressed || selecting ? 0.8 : 1 })}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>Auftragnehmer</Text>
        </Pressable>

        <Pressable onPress={() => handleRoleSelect('employer')} disabled={selecting} style={({ pressed }) => ({ backgroundColor: COLORS.neon, paddingVertical: 20, borderRadius: 16, alignItems: 'center', opacity: pressed || selecting ? 0.8 : 1 })}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>Auftraggeber</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
