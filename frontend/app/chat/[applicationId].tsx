import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getMessagesForApplication, addMessage } from '../../utils/chatStore';
import { ChatMessage } from '../../types/chat';
import { Ionicons } from '@expo/vector-icons';

// NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  whiteTransparent20: 'rgba(255,255,255,0.2)',
  whiteTransparent10: 'rgba(255,255,255,0.1)',
  neonShadow: 'rgba(200,255,22,0.2)',
};

export default function ChatScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      setIsLoading(true);
      try {
        const msgs = await getMessagesForApplication(String(applicationId));
        setMessages(msgs);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [applicationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]}>
        <View style={styles.centerContent}>
          <Text style={{ color: colors.gray700 }}>Bitte einloggen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const senderRole = user.role === 'worker' ? 'worker' : 'employer';

  async function handleSend() {
    const text = input.trim();
    if (!text || !applicationId) return;
    
    setIsSending(true);
    try {
      const msg = await addMessage(String(applicationId), senderRole, text);
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }

  const formatTime = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View 
          style={[
            styles.header, 
            { 
              backgroundColor: colors.white, 
              borderBottomColor: colors.gray200,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.black }]}>
            Chat
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.gray600 }]}>
            Bewerbung #{applicationId?.slice(-8)}
          </Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { padding: spacing.md, paddingBottom: spacing.lg }
          ]}
        >
          {isLoading ? (
            <View style={styles.centerContent}>
              <Text style={{ color: colors.gray500 }}>Nachrichten werden geladen...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={{ color: colors.gray500, textAlign: 'center' }}>
                Noch keine Nachrichten.{'\n'}
                Schreibe die erste Nachricht!
              </Text>
            </View>
          ) : (
            messages.map(m => {
              const isOwn = m.senderRole === senderRole;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    {
                      alignSelf: isOwn ? 'flex-end' : 'flex-start',
                      backgroundColor: isOwn ? colors.black : colors.white,
                      marginBottom: spacing.xs,
                      maxWidth: '80%',
                    },
                  ]}
                >
                  <Text style={[styles.messageText, { color: isOwn ? colors.white : colors.black }]}>
                    {m.text}
                  </Text>
                  <Text style={[styles.messageTime, { color: isOwn ? colors.gray300 : colors.gray500 }]}>
                    {formatTime(m.createdAt)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View 
          style={[
            styles.inputContainer, 
            { 
              backgroundColor: colors.white,
              borderTopColor: colors.gray200,
              padding: spacing.md,
            }
          ]}
        >
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nachricht schreiben…"
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={500}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.beige50,
                  borderColor: colors.gray200,
                  color: colors.black,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }
              ]}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Button
              title={isSending ? '...' : 'Senden'}
              onPress={handleSend}
              disabled={isSending || !input.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 14,
  },
});
