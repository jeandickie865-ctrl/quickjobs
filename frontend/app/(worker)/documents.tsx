import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import * as DocumentPicker from 'expo-document-picker';

const COLORS = {
  bg: '#141126',
  card: '#1C1838',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
  error: '#FF4D4D',
  success: '#4ADE80',
  black: '#000000'
};

interface Document {
  id: string;
  filename: string;
  content_type: string;
  data: string;
  uploaded_at: string;
}

export default function WorkerDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Lade vorhandene Dokumente
  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/profiles/worker/${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setDocuments(profile.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  // Dokument hochladen
  const handleUpload = async () => {
    try {
      // Öffne Dokumenten-Picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Prüfe Dateigröße (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          'Datei zu groß',
          'Die Datei darf maximal 5 MB groß sein.',
          [{ text: 'OK' }]
        );
        return;
      }

      setUploading(true);

      // Lese Datei als Base64
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64String = base64data.split(',')[1]; // Entferne "data:*/*;base64," prefix

        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          // Erstelle FormData für Upload
          const formData = new FormData();
          formData.append('file', {
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
            name: file.name
          } as any);

          const uploadResponse = await fetch(`${API_URL}/profiles/worker/${user?.id}/documents`, {
            method: 'POST',
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData
          });

          if (uploadResponse.ok) {
            Alert.alert(
              'Erfolg',
              'Dokument wurde hochgeladen.',
              [{ text: 'OK' }]
            );
            // Lade Dokumente neu
            await loadDocuments();
          } else {
            const errorData = await uploadResponse.json();
            Alert.alert(
              'Fehler',
              errorData.detail || 'Dokument konnte nicht hochgeladen werden.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert(
            'Fehler',
            'Ein Fehler ist beim Hochladen aufgetreten.',
            [{ text: 'OK' }]
          );
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Document picker error:', error);
      setUploading(false);
    }
  };

  // Dokument löschen
  const handleDelete = async (documentId: string, filename: string) => {
    Alert.alert(
      'Dokument löschen',
      `Möchten Sie "${filename}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              const response = await fetch(`${API_URL}/profiles/worker/${user?.id}/documents/${documentId}`, {
                method: 'DELETE',
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });

              if (response.ok) {
                // Lade Dokumente neu
                await loadDocuments();
                Alert.alert('Erfolg', 'Dokument wurde gelöscht.', [{ text: 'OK' }]);
              } else {
                Alert.alert('Fehler', 'Dokument konnte nicht gelöscht werden.', [{ text: 'OK' }]);
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Fehler', 'Ein Fehler ist beim Löschen aufgetreten.', [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  // Formatiere Dateigröße
  const formatFileSize = (base64String: string): string => {
    const sizeInBytes = (base64String.length * 3) / 4;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;
    
    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    }
    return `${sizeInKB.toFixed(2)} KB`;
  };

  // Formatiere Datum
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginTop: 12 }}>Lädt Dokumente...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ marginBottom: 16 }}
          >
            <Text style={{ color: COLORS.purple, fontSize: 16, fontWeight: '600' }}>
              ← Zurück
            </Text>
          </Pressable>
          
          <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '900', marginBottom: 8 }}>
            Qualifikationsnachweise
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>
            Lade Zertifikate, Lizenzen oder andere Nachweise hoch, um deine Qualifikationen zu belegen.
          </Text>
        </View>

        {/* Upload Button */}
        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          style={{
            backgroundColor: COLORS.purple,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 24,
            opacity: uploading ? 0.5 : 1
          }}
        >
          {uploading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>
              + Dokument hochladen
            </Text>
          )}
        </Pressable>

        {/* Info Box */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLORS.border
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            📄 Hinweise
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 20 }}>
            • Erlaubte Formate: PDF, JPG, PNG, WEBP{'\n'}
            • Maximale Dateigröße: 5 MB{'\n'}
            • Deine Dokumente werden sicher verschlüsselt gespeichert
          </Text>
        </View>

        {/* Documents List */}
        {documents.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 16, textAlign: 'center' }}>
              Noch keine Dokumente hochgeladen
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {documents.map((doc) => (
              <View
                key={doc.id}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                      {doc.filename}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                      {formatDate(doc.uploaded_at)} • {formatFileSize(doc.data)}
                    </Text>
                  </View>
                  
                  <Pressable
                    onPress={() => handleDelete(doc.id, doc.filename)}
                    style={{
                      backgroundColor: COLORS.error,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>
                      Löschen
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
