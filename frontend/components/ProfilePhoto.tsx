import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';

type ProfilePhotoProps = {
  photoUri?: string;
  userName?: string;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemove?: () => void;
};

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  photoUri,
  userName = 'User',
  onPhotoSelected,
  onPhotoRemove,
}) => {
  const { colors, spacing } = useTheme();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Berechtigung erforderlich',
        'Bitte erlaube Zugriff auf deine Fotos in den Einstellungen.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (max 5 MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Datei zu groß', 'Bitte wähle ein Bild unter 5 MB.');
          return;
        }

        onPhotoSelected(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Bild konnte nicht geladen werden.');
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Foto entfernen',
      'Möchtest du dein Profilfoto wirklich entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => onPhotoRemove?.(),
        },
      ]
    );
  };

  // Get initials for placeholder
  const getInitials = () => {
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { backgroundColor: colors.gray200 }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.gray300 }]}>
            <Text style={[styles.initials, { color: colors.black }]}>
              {getInitials()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={pickImage}
          style={[
            styles.button,
            {
              backgroundColor: colors.black,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            {photoUri ? 'Foto ändern' : 'Foto hochladen'}
          </Text>
        </TouchableOpacity>

        {photoUri && onPhotoRemove && (
          <TouchableOpacity
            onPress={handleRemove}
            style={[
              styles.removeButton,
              {
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text style={[styles.removeText, { color: colors.gray700 }]}>
              Entfernen
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.gray600, marginTop: spacing.xs }]}>
        Empfohlen: neutrales Porträt, gut erkennbares Gesicht
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 40,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  button: {
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    borderRadius: 6,
  },
  removeText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
