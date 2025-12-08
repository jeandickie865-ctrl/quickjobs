// app/dev/debug.tsx - DEVELOPER DEBUG SCREEN
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  black: '#000000',
  neon: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#00A07C",
  purple: '#EFABFF',
  darkGray: '#FFFFFF',
  neonTransparent: 'rgba(200,255,22,0.1)',
};

const KNOWN_KEYS = [
  '@shiftmatch:user',
  '@shiftmatch:users_database',
  '@shiftmatch:employer_profile',
  '@shiftmatch:worker_profile',
  '@shiftmatch:address_cache',
  '@backup:payments',
];

export default function DebugScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [showUserData, setShowUserData] = useState(false);
  const [showDatabaseData, setShowDatabaseData] = useState(false);

  // Check if DEV mode
  if (!__DEV__) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: COLORS.black, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20,
      }}>
        <Ionicons name="warning-outline" size={64} color={COLORS.neon} />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: COLORS.white, 
          marginTop: 20,
          textAlign: 'center',
        }}>
          Not available in production.
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: COLORS.white, 
          opacity: 0.6,
          marginTop: 8,
          textAlign: 'center',
        }}>
          This debug screen is only available in development mode.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      setAllKeys(keys);

      const data: Record<string, any> = {};
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        try {
          data[key] = value ? JSON.parse(value) : value;
        } catch {
          data[key] = value;
        }
      }
      setStorageData(data);
    } catch (error) {
      console.error('Error loading storage:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveKey(key: string) {
    Alert.alert(
      'Bestätigung',
      `Möchtest du "${key}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(key);
            await loadAllData();
            Alert.alert('Erfolg', `"${key}" wurde gelöscht.`);
          },
        },
      ]
    );
  }

  async function handleClearAll() {
    Alert.alert(
      '⚠️ WARNUNG',
      'Möchtest du wirklich ALLE Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'ALLE LÖSCHEN',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            await loadAllData();
            Alert.alert('Erfolg', 'Alle Daten wurden gelöscht.');
          },
        },
      ]
    );
  }

  async function handleShowUser() {
    const userData = storageData['@shiftmatch:user'];
    if (userData) {
      setShowUserData(true);
    } else {
      Alert.alert('Info', 'Kein User gespeichert.');
    }
  }

  async function handleShowDatabase() {
    const dbData = storageData['@shiftmatch:users_database'];
    if (dbData) {
      setShowDatabaseData(true);
    } else {
      Alert.alert('Info', 'Keine User-Datenbank gespeichert.');
    }
  }

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: COLORS.black, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
        <Text style={{ color: COLORS.white, marginTop: 16 }}>Lade Debug-Daten...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <AppHeader />
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 2,
          borderBottomColor: COLORS.neon,
        }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.neon} />
          </Pressable>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '700', 
            color: COLORS.neon, 
            marginLeft: 16 
          }}>
            Developer Debug
          </Text>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 16 }}
        >
          {/* Stats */}
          <View style={{
            backgroundColor: COLORS.darkGray,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: COLORS.neon,
            padding: 16,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
              Storage Stats
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.white }}>
              Gespeicherte Keys: {allKeys.length}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon, marginBottom: 4 }}>
              Quick Actions
            </Text>

            <DebugButton
              label="User zurücksetzen"
              icon="person-remove-outline"
              onPress={() => handleRemoveKey('@shiftmatch:user')}
            />

            <DebugButton
              label="User-Datenbank löschen"
              icon="people-outline"
              onPress={() => handleRemoveKey('@shiftmatch:users_database')}
            />

            <DebugButton
              label="Employer-Profil löschen"
              icon="briefcase-outline"
              onPress={() => handleRemoveKey('@shiftmatch:employer_profile')}
            />

            <DebugButton
              label="Worker-Profil löschen"
              icon="construct-outline"
              onPress={() => handleRemoveKey('@shiftmatch:worker_profile')}
            />

            <DebugButton
              label="Adresseingaben löschen"
              icon="location-outline"
              onPress={() => handleRemoveKey('@shiftmatch:address_cache')}
            />

            <DebugButton
              label="ALLE Daten löschen"
              icon="trash-outline"
              onPress={handleClearAll}
              danger
            />
          </View>

          {/* Debug View Buttons */}
          <View style={{ gap: 12, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon, marginBottom: 4 }}>
              Debug Views
            </Text>

            <DebugButton
              label="Debug: User anzeigen"
              icon="eye-outline"
              onPress={handleShowUser}
            />

            <DebugButton
              label="Debug: Datenbank anzeigen"
              icon="server-outline"
              onPress={handleShowDatabase}
            />

            <DebugButton
              label="Daten neu laden"
              icon="refresh-outline"
              onPress={loadAllData}
            />
          </View>

          {/* User Data View */}
          {showUserData && storageData['@shiftmatch:user'] && (
            <View style={{
              backgroundColor: COLORS.darkGray,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: COLORS.neon,
              padding: 16,
              marginTop: 20,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon }}>
                  Current User
                </Text>
                <Pressable onPress={() => setShowUserData(false)}>
                  <Ionicons name="close" size={24} color={COLORS.neon} />
                </Pressable>
              </View>
              <ScrollView horizontal>
                <Text style={{ fontSize: 12, color: COLORS.white, fontFamily: 'monospace' }}>
                  {JSON.stringify(storageData['@shiftmatch:user'], null, 2)}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Database View */}
          {showDatabaseData && storageData['@shiftmatch:users_database'] && (
            <View style={{
              backgroundColor: COLORS.darkGray,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: COLORS.neon,
              padding: 16,
              marginTop: 20,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon }}>
                  Users Database
                </Text>
                <Pressable onPress={() => setShowDatabaseData(false)}>
                  <Ionicons name="close" size={24} color={COLORS.neon} />
                </Pressable>
              </View>
              <ScrollView horizontal>
                <Text style={{ fontSize: 12, color: COLORS.white, fontFamily: 'monospace' }}>
                  {JSON.stringify(storageData['@shiftmatch:users_database'], null, 2)}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* All Keys List */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon, marginBottom: 12 }}>
              Alle gespeicherten Keys ({allKeys.length})
            </Text>
            {allKeys.map((key) => (
              <View
                key={key}
                style={{
                  backgroundColor: COLORS.darkGray,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.neon,
                  padding: 12,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ 
                  fontSize: 13, 
                  color: COLORS.white, 
                  flex: 1,
                  fontFamily: 'monospace',
                }}>
                  {key}
                </Text>
                <Pressable 
                  onPress={() => handleRemoveKey(key)}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.neon} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Debug Button Component
function DebugButton({ 
  label, 
  icon, 
  onPress, 
  danger = false 
}: { 
  label: string; 
  icon: keyof typeof Ionicons.glyphMap; 
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: danger ? 'rgba(255,77,77,0.1)' : COLORS.neonTransparent,
        borderWidth: 2,
        borderColor: danger ? '#E64A4A' : COLORS.neon,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={danger ? '#E64A4A' : COLORS.neon} 
      />
      <Text style={{ 
        fontSize: 15, 
        fontWeight: '600', 
        color: danger ? '#E64A4A' : COLORS.neon,
        flex: 1,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
