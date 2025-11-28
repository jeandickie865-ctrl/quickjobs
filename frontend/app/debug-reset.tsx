// app/debug-reset.tsx - Debug-Seite zum Token-Reset
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF4444',
};

export default function DebugResetScreen() {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<string>('');

  async function checkToken() {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      setTokenInfo(`Token gefunden: ${token.substring(0, 30)}...`);
    } else {
      setTokenInfo('Kein Token gefunden');
    }
  }

  async function clearToken() {
    await AsyncStorage.clear();
    Alert.alert(
      'Erfolg!',
      'Alle Daten gelöscht. Bitte App neu laden.',
      [
        {
          text: 'Zum Login',
          onPress: () => router.replace('/auth/login')
        }
      ]
    );
  }

  React.useEffect(() => {
    checkToken();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.neon, marginBottom: 20, textAlign: 'center' }}>
        🔧 Debug Reset
      </Text>

      <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: COLORS.black, marginBottom: 10 }}>
          {tokenInfo || 'Lade...'}
        </Text>
      </View>

      <Pressable
        onPress={clearToken}
        style={{
          backgroundColor: COLORS.red,
          paddingVertical: 18,
          borderRadius: 16,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
          🗑️ Alle Daten löschen
        </Text>
      </Pressable>

      <Pressable
        onPress={checkToken}
        style={{
          backgroundColor: COLORS.neon,
          paddingVertical: 18,
          borderRadius: 16,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
          🔄 Token neu prüfen
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace('/auth/login')}
        style={{
          backgroundColor: COLORS.white,
          paddingVertical: 18,
          borderRadius: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
          → Zum Login
        </Text>
      </Pressable>

      <Text style={{ fontSize: 12, color: COLORS.white, marginTop: 20, textAlign: 'center', opacity: 0.7 }}>
        Diese Seite hilft bei Token-Problemen.{'\n'}
        URL: /debug-reset
      </Text>
    </View>
  );
}
