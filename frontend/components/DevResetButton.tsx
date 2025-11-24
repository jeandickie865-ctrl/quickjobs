// components/DevResetButton.tsx - DEV ONLY RESET BUTTON
import React, { useState } from 'react';
import { Pressable, Text, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  neon: '#C8FF16',
  black: '#000000',
  purple: '#5941FF',
};

export default function DevResetButton() {
  const [isResetting, setIsResetting] = useState(false);

  // Nur im DEV-Modus anzeigen
  if (!__DEV__) return null;

  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      await AsyncStorage.removeItem('@shiftmatch:user');
      await AsyncStorage.removeItem('@shiftmatch:users_database');
      
      Alert.alert(
        '🧹 Reset erfolgreich',
        'Alle Benutzerdaten wurden gelöscht. Bitte App neu starten.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Reset error:', error);
      Alert.alert('Fehler', 'Konnte Daten nicht löschen.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Pressable
      onPress={handleReset}
      disabled={isResetting}
      style={({ pressed }) => ({
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.neon,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        opacity: pressed ? 0.7 : 1,
        marginTop: 20,
      })}
    >
      {isResetting ? (
        <ActivityIndicator color={COLORS.neon} />
      ) : (
        <Text style={{ 
          fontSize: 13, 
          fontWeight: '700', 
          color: COLORS.neon 
        }}>
          🧹 DEV: Reset Auth Storage
        </Text>
      )}
    </Pressable>
  );
}
