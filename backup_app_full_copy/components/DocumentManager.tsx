import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeProvider';
import { WorkerDocument, DocumentType } from '../types/profile';

type DocumentManagerProps = {
  documents: WorkerDocument[];
  onDocumentAdd: (document: Omit<WorkerDocument, 'id' | 'uploadedAt'>) => void;
  onDocumentRemove: (documentId: string) => void;
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  fuehrungszeugnis: 'Führungszeugnis',
  ausweis: 'Ausweisdokument',
  qualifikation: 'Qualifikationsnachweis',
  arbeitserlaubnis: 'Arbeitserlaubnis',
  sonstiges: 'Sonstiges',
};

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onDocumentAdd,
  onDocumentRemove,
}) => {
  const { colors, spacing } = useTheme();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

  const pickDocument = async (type: DocumentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setShowTypeSelector(false);
        setSelectedType(null);
        return;
      }

      const asset = result.assets[0];

      // Check file size (max 10 MB)
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('Datei zu groß', 'Bitte wähle eine Datei unter 10 MB.');
        return;
      }

      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (asset.mimeType && !validTypes.includes(asset.mimeType)) {
        Alert.alert('Ungültiges Format', 'Nur PDF, JPG und PNG sind erlaubt.');
        return;
      }

      onDocumentAdd({
        type,
        fileUri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
      });

      setShowTypeSelector(false);
      setSelectedType(null);
      Alert.alert('Erfolg', 'Dokument wurde hinzugefügt.');
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Fehler', 'Dokument konnte nicht geladen werden.');
    }
  };

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    pickDocument(type);
  };

  const handleRemove = (doc: WorkerDocument) => {
    Alert.alert(
      'Dokument entfernen',
      `Möchtest du "${doc.fileName}" wirklich entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => onDocumentRemove(doc.id),
        },
      ]
    );
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.black }]}>Dokumente</Text>
        <TouchableOpacity
          onPress={() => setShowTypeSelector(!showTypeSelector)}
          style={[
            styles.addButton,
            {
              backgroundColor: colors.black,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Text style={[styles.addButtonText, { color: colors.white }]}>
            + Dokument hochladen
          </Text>
        </TouchableOpacity>
      </View>

      {showTypeSelector && (
        <View
          style={[
            styles.typeSelectorContainer,
            {
              backgroundColor: colors.white,
              borderColor: colors.gray200,
              padding: spacing.sm,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Text style={[styles.typeSelectorTitle, { color: colors.gray700 }]}>
            Dokumenttyp wählen:
          </Text>
          <View style={styles.typeButtons}>
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleTypeSelect(type)}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: colors.beige100,
                    borderColor: colors.gray300,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text style={[styles.typeButtonText, { color: colors.black }]}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setShowTypeSelector(false)}
            style={[styles.cancelButton, { marginTop: spacing.sm }]}
          >
            <Text style={[styles.cancelText, { color: colors.gray600 }]}>
              Abbrechen
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {documents.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.white,
              borderColor: colors.gray200,
              padding: spacing.lg,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.gray600 }]}>
            Noch keine Dokumente hochgeladen
          </Text>
        </View>
      ) : (
        <View style={[styles.documentList, { marginTop: spacing.md }]}>
          {documents.map((doc) => (
            <View
              key={doc.id}
              style={[
                styles.documentItem,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.gray200,
                  padding: spacing.sm,
                },
              ]}
            >
              <View style={styles.documentInfo}>
                <Text style={[styles.documentType, { color: colors.black }]}>
                  {DOCUMENT_TYPE_LABELS[doc.type]}
                </Text>
                <Text style={[styles.documentName, { color: colors.gray700 }]}>
                  {doc.fileName}
                </Text>
                <Text style={[styles.documentDate, { color: colors.gray500 }]}>
                  Hochgeladen: {formatDate(doc.uploadedAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(doc)}
                style={[
                  styles.removeButton,
                  {
                    backgroundColor: colors.gray100,
                    padding: spacing.xs,
                  },
                ]}
              >
                <Text style={[styles.removeButtonText, { color: colors.gray700 }]}>
                  Löschen
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.hint, { color: colors.gray600, marginTop: spacing.sm }]}>
        Erlaubte Formate: PDF, JPG, PNG (max. 10 MB)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeSelectorContainer: {
    borderWidth: 1,
    borderRadius: 12,
  },
  typeSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    borderWidth: 1,
    borderRadius: 8,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  documentList: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  documentInfo: {
    flex: 1,
    gap: 4,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentName: {
    fontSize: 13,
  },
  documentDate: {
    fontSize: 11,
  },
  removeButton: {
    borderRadius: 6,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
