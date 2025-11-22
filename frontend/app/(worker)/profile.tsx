// app/(worker)/profile.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getWorkerProfile, uploadProfilePhoto, updateWorkerProfile } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';

export default function WorkerProfileScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getWorkerProfile();
      setProfile(data);
    } catch (err) {
      console.log('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;

      setUploading(true);

      const uploadRes = await uploadProfilePhoto(uri);
      const updated = await updateWorkerProfile({
        photo_url: uploadRes.url,
      });

      setProfile(updated);
      Alert.alert('Erfolg', 'Foto aktualisiert');
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert('Fehler', 'Foto konnte nicht hochgeladen werden.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <Text style={{ 
        color: colors.text, 
        fontSize: 24, 
        fontWeight: '700', 
        textAlign: 'center',
        marginBottom: 32 
      }}>
        Mein Profil
      </Text>

      {/* Avatar Section with Neon Border */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{
          borderWidth: 4,
          borderColor: colors.neon,
          borderRadius: 100,
          padding: 8,
          backgroundColor: colors.primary,
        }}>
          <Image
            source={
              profile?.photo_url
                ? { uri: profile.photo_url }
                : { uri: 'https://via.placeholder.com/160/CCCCCC/000000?text=US' }
            }
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: '#E0E0E0',
            }}
          />
        </View>

        <Pressable
          onPress={pickPhoto}
          disabled={uploading}
          style={{
            marginTop: 20,
            backgroundColor: uploading ? colors.gray500 : colors.neon,
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 32,
            minWidth: 180,
            alignItems: 'center',
          }}
        >
          {uploading ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <Text style={{ color: colors.black, fontWeight: '700', fontSize: 16 }}>
              Foto hochladen
            </Text>
          )}
        </Pressable>
        
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          marginTop: 12,
          textAlign: 'center',
          opacity: 0.8
        }}>
          📸 Foto hochladen
        </Text>
      </View>

      {/* NAME Field */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          fontWeight: '700', 
          letterSpacing: 0.5,
          marginBottom: 8 
        }}>
          NAME
        </Text>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderWidth: 2,
          borderColor: colors.primary,
        }}>
          <Text style={{ color: colors.black, fontSize: 16 }}>
            {profile?.name || 'Dein Name'}
          </Text>
        </View>
      </View>

      {/* WOHNORT Field */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          fontWeight: '700', 
          letterSpacing: 0.5,
          marginBottom: 8 
        }}>
          WOHNORT
        </Text>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderWidth: 2,
          borderColor: colors.primary,
        }}>
          <Text style={{ color: colors.black, fontSize: 16 }}>
            {profile?.city || 'Stadt'}
          </Text>
        </View>
      </View>

      {/* RADIUS Field */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          fontWeight: '700', 
          letterSpacing: 0.5,
          marginBottom: 8 
        }}>
          RADIUS (KM)
        </Text>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderWidth: 2,
          borderColor: colors.primary,
        }}>
          <Text style={{ color: colors.black, fontSize: 16 }}>
            {profile?.radius_km || '15'}
          </Text>
        </View>
      </View>

      {/* KATEGORIEN */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          fontWeight: '700', 
          letterSpacing: 0.5,
          marginBottom: 12 
        }}>
          KATEGORIEN
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(profile?.categories || []).map((cat, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.white,
                borderRadius: 20,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: colors.black, fontSize: 14, fontWeight: '500' }}>
                {cat}
              </Text>
            </View>
          ))}
          {(!profile?.categories || profile.categories.length === 0) && (
            <Text style={{ color: colors.caption, fontSize: 14 }}>
              Keine Kategorien ausgewählt
            </Text>
          )}
        </View>
      </View>

      {/* ACTIVITIES */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          fontWeight: '700', 
          letterSpacing: 0.5,
          marginBottom: 8 
        }}>
          ACTIVITIES
        </Text>
        <Text style={{ color: colors.caption, fontSize: 14 }}>
          {profile?.activities?.join(', ') || 'Keine Aktivitäten'}
        </Text>
      </View>

      {/* QUALIFICATIONS */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          color: colors.neon, 
          fontSize: 12, 
          fontWeight: '700', 
          letterSpacing: 0.5,
          marginBottom: 8 
        }}>
          QUALIFICATIONS
        </Text>
        <Text style={{ color: colors.caption, fontSize: 14 }}>
          {profile?.qualifications?.join(', ') || 'Keine Qualifikationen'}
        </Text>
      </View>

      {/* Save Button - Full Width Neon */}
      <Pressable
        style={{
          backgroundColor: colors.neon,
          borderRadius: 18,
          paddingVertical: 18,
          alignItems: 'center',
          marginTop: 20,
          marginBottom: 40,
        }}
        onPress={() => Alert.alert('Info', 'Profil bearbeiten noch nicht implementiert')}
      >
        <Text style={{ 
          color: colors.black, 
          fontSize: 16, 
          fontWeight: '700',
          letterSpacing: 0.5 
        }}>
          Profil speichern
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
