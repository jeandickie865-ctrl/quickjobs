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
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '700' }}>
        Dein Profil
      </Text>

      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Image
          source={
            profile?.photo_url
              ? { uri: profile.photo_url }
              : { uri: 'https://via.placeholder.com/130' }
          }
          style={{
            width: 130,
            height: 130,
            borderRadius: 100,
            borderWidth: 3,
            borderColor: colors.accent,
          }}
        />

        <Pressable
          onPress={pickPhoto}
          disabled={uploading}
          style={{
            marginTop: 15,
            borderWidth: 2,
            borderColor: colors.accent,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 20,
            opacity: uploading ? 0.5 : 1,
          }}
        >
          {uploading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
              Foto ändern
            </Text>
          )}
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          borderWidth: 2,
          borderColor: colors.accent,
          gap: 10,
        }}
      >
        <Text style={{ color: '#000000', fontSize: 18, fontWeight: '700' }}>
          Persönliche Daten
        </Text>

        <Text style={{ color: '#666666', fontSize: 14 }}>
          Name: {profile?.name || '—'}
        </Text>
        <Text style={{ color: '#666666', fontSize: 14 }}>
          Stadt: {profile?.city || '—'}
        </Text>
        <Text style={{ color: '#666666', fontSize: 14 }}>
          Kategorien: {profile?.categories?.join(', ') || '—'}
        </Text>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}
