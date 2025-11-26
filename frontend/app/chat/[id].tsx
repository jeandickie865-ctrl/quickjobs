// app/chat/[id].tsx - Shared Chat Screen for Worker & Employer
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://jobnexus.preview.emergentagent.com';
const API_BASE = `${BACKEND_URL}/api`;

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  gray: '#999999',
  lightGray: '#F5F5F5',
};

interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const applicationId = params.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (applicationId) {
      loadMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [applicationId]);

  async function loadMessages() {
    if (!applicationId || !user) return;

    try {
      const userJson = await AsyncStorage.getItem('@shiftmatch:user');
      if (!userJson) return;
      const currentUser = JSON.parse(userJson);

      const response = await fetch(`${API_BASE}/chat/messages/${applicationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Auto-scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !applicationId || !user) return;

    setSending(true);
    try {
      const userJson = await AsyncStorage.getItem('@shiftmatch:user');
      if (!userJson) return;
      const currentUser = JSON.parse(userJson);

      const response = await fetch(`${API_BASE}/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          padding: 16, 
          backgroundColor: COLORS.purple,
          borderBottomWidth: 2,
          borderBottomColor: COLORS.neon,
        }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ color: COLORS.neon, fontSize: 28 }}>←</Text>
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
            Chat
          </Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: COLORS.white, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.purple} style={{ marginTop: 40 }} />
          ) : messages.length === 0 ? (
            <Text style={{ textAlign: 'center', color: COLORS.gray, marginTop: 40 }}>
              Noch keine Nachrichten. Schreiben Sie die erste Nachricht!
            </Text>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    backgroundColor: isMe ? COLORS.neon : COLORS.lightGray,
                    padding: 12,
                    borderRadius: 16,
                    marginBottom: 12,
                    maxWidth: '75%',
                  }}
                >
                  <Text style={{ fontSize: 15, color: isMe ? '#000' : '#333' }}>
                    {msg.message}
                  </Text>
                  <Text style={{ 
                    fontSize: 11, 
                    color: isMe ? 'rgba(0,0,0,0.5)' : COLORS.gray, 
                    marginTop: 4 
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ 
          flexDirection: 'row', 
          padding: 16, 
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        }}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Nachricht schreiben..."
            style={{
              flex: 1,
              backgroundColor: COLORS.lightGray,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              marginRight: 12,
            }}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={({ pressed }) => ({
              backgroundColor: newMessage.trim() ? COLORS.neon : COLORS.gray,
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={{ fontSize: 24 }}>→</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
