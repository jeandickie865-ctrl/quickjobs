import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
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
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.white, fontSize: 16 }}>Bitte einloggen.</Text>
      </View>
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
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        marginLeft: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.08,
        blur: 60,
      }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.whiteTransparent10,
          }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
                💬 Chat
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.whiteTransparent20, marginTop: 2 }}>
                ID: {applicationId?.slice(-8)}
              </Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 24, flexGrow: 1 }}
          >
            {isLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.neon} size="large" />
                <Text style={{ color: COLORS.whiteTransparent20, marginTop: 12 }}>Lädt...</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
                <Text style={{ color: COLORS.whiteTransparent20, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                  💬 Noch keine Nachrichten.{'\n'}Schreibe die erste Nachricht!
                </Text>
              </View>
            ) : (
              messages.map(m => {
                const isOwn = m.senderRole === senderRole;
                return (
                  <View
                    key={m.id}
                    style={{
                      alignSelf: isOwn ? 'flex-end' : 'flex-start',
                      backgroundColor: isOwn ? COLORS.neon : COLORS.white,
                      marginBottom: 12,
                      maxWidth: '75%',
                      borderRadius: 18,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      shadowColor: isOwn ? COLORS.neon : COLORS.black,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isOwn ? 0.3 : 0.1,
                      shadowRadius: isOwn ? 8 : 4,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ 
                      fontSize: 15, 
                      color: isOwn ? COLORS.black : COLORS.darkGray,
                      lineHeight: 21,
                    }}>
                      {m.text}
                    </Text>
                    <Text style={{ 
                      fontSize: 11, 
                      color: isOwn ? 'rgba(0,0,0,0.5)' : '#999',
                      marginTop: 6,
                    }}>
                      {formatTime(m.createdAt)}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={{
            backgroundColor: COLORS.whiteTransparent10,
            borderTopWidth: 1,
            borderTopColor: COLORS.whiteTransparent10,
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: Platform.OS === 'ios' ? 32 : 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Nachricht schreiben…"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                maxLength={500}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.whiteTransparent10,
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: COLORS.white,
                  maxHeight: 100,
                }}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <Pressable
                onPress={handleSend}
                disabled={isSending || !input.trim()}
                style={({ pressed }) => ({
                  backgroundColor: (isSending || !input.trim()) ? '#888' : COLORS.neon,
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: COLORS.neon,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                })}
              >
                {isSending ? (
                  <ActivityIndicator color={COLORS.black} size="small" />
                ) : (
                  <Ionicons name="send" size={22} color={COLORS.black} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Styles are inline with NEON design
