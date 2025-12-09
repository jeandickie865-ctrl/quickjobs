// app/chat/[id].tsx – Quickjobs Modern Chat Design
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";

import { loadMessages, sendMessage, checkChatUnlocked } from "../../utils/chatStore";

const COLORS = {
  bg: '#FFFFFF',
  card: '#F9FAFB',
  border: '#E9D5FF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  purple: '#EFABFF',
  orange: '#FF773D',
  white: '#FFFFFF',
  inputBg: '#FFFFFF',
  myMessageBg: '#EFABFF',       // Lila für eigene Nachrichten
  myMessageText: '#1A1A1A',      // Dunkel für eigene Nachrichten
  theirMessageBg: '#F3F4F6',     // Hellgrau für fremde Nachrichten
  theirMessageText: '#1A1A1A',   // Dunkel für fremde Nachrichten
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.id as string;

  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    let isFirstLoad = true;

    async function loadChat() {
      try {
        if (isFirstLoad) {
          setLoading(true);
          isFirstLoad = false;
        }

        const isUnlocked = await checkChatUnlocked(applicationId);
        if (!isUnlocked) {
          setLocked(true);
          setLoading(false);
          return;
        }

        const msgs = await loadMessages(applicationId);
        console.log('🔍 Raw messages from API:', JSON.stringify(msgs, null, 2));
        console.log('🔍 First message text:', msgs[0]?.text);
        console.log('🔍 First message keys:', msgs[0] ? Object.keys(msgs[0]) : 'no messages');
        if (mounted) {
          // Prüfe, ob neue Nachrichten da sind
          if (msgs && msgs.length > previousMessageCount.current && !isFirstLoad) {
            setHasNewMessages(true);
            // Automatisch nach 3 Sekunden ausblenden
            setTimeout(() => setHasNewMessages(false), 3000);
          }
          previousMessageCount.current = msgs?.length || 0;
          setMessages(msgs || []);
        }
      } catch (err) {
        console.error('💥 Load messages error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadChat();

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      if (mounted && isFocused && !locked) loadChat();
    }, 4000);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [applicationId]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages]);

  useEffect(() => {
    if (!isTyping) return;
    const timeout = setTimeout(() => setIsTyping(false), 800);
    return () => clearTimeout(timeout);
  }, [isTyping]);

  async function handleSend() {
    if (sending || !text.trim() || locked) return;

    try {
      setSending(true);
      const msg = await sendMessage(applicationId, text.trim());
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (err) {
      if (String(err).includes("CHAT_LOCKED")) setLocked(true);
    } finally {
      setSending(false);
    }
  }

  // LOCKED STATE
  if (locked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          padding: 16, 
          backgroundColor: COLORS.purple,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border
        }}>
          <Pressable onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(worker)/matches');
            }
          }} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Chat</Text>
        </View>
        
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Ionicons name="lock-closed" size={64} color={COLORS.purple} />
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "700", marginTop: 20 }}>
            Chat gesperrt
          </Text>
          <Text style={{ color: COLORS.textMuted, marginTop: 12, textAlign: "center", fontSize: 16 }}>
            Du kannst erst schreiben, nachdem die 20% Provision bezahlt wurde.
          </Text>

          <Pressable
            onPress={() => router.push(`/payment/${applicationId}`)}
            style={{
              backgroundColor: COLORS.orange,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 16,
              marginTop: 32,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              alignItems: 'center',
              shadowColor: COLORS.orange,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: COLORS.white, fontSize: 16 }}>
              Jetzt freischalten
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // LOADING
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          padding: 16, 
          backgroundColor: COLORS.purple,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border
        }}>
          <Pressable onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(worker)/matches');
            }
          }} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Chat</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={COLORS.purple} size="large" />
          <Text style={{ color: COLORS.text, marginTop: 16, fontSize: 16 }}>Lade Chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // CHAT
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Custom Header mit Zurück-Button */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        backgroundColor: COLORS.purple,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
      }}>
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              // Fallback: Gehe zu Matches
              const role = user?.role;
              if (role === 'worker') {
                router.replace('/(worker)/matches');
              } else if (role === 'employer') {
                router.replace('/(employer)/matches');
              }
            }
          }} 
          style={{ padding: 4, marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>Chat</Text>
        {messages.length > 0 && (
          <Text style={{ fontSize: 12, color: '#FFFFFF', opacity: 0.8 }}>
            {messages.length} Nachricht{messages.length !== 1 ? 'en' : ''}
          </Text>
        )}
      </View>
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          style={{ flex: 1 }}
          keyExtractor={(item, index) => item.id || item._id || `msg-${index}`}
          renderItem={({ item }) => {
            const isOwn = item.senderId === user?.id;

            return (
              <View
                style={{
                  padding: 12,
                  marginVertical: 4,
                  marginHorizontal: 16,
                  maxWidth: "75%",
                  alignSelf: isOwn ? "flex-end" : "flex-start",
                  backgroundColor: isOwn ? COLORS.myMessageBg : COLORS.theirMessageBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isOwn ? '#E9D5FF' : '#E5E7EB',
                }}
              >
                {console.log('💬 Chat item:', JSON.stringify(item, null, 2))}
                <Text style={{ color: '#000000', fontSize: 15, lineHeight: 20, fontWeight: '600' }}>
                  {item.text || item.message || item.body || item.content || item.textBody || '[Keine Nachricht]'}
                </Text>
                <Text style={{ color: '#666666', fontSize: 11, marginTop: 4, textAlign: isOwn ? 'right' : 'left' }}>
                  {item.createdAt && !isNaN(new Date(item.createdAt).getTime()) 
                    ? new Date(item.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textMuted, marginTop: 12, textAlign: 'center' }}>
                Noch keine Nachrichten.
                Schreib die erste Nachricht!
              </Text>
            </View>
          }
        />

        {/* INPUT BAR */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}>
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              setIsTyping(true);
            }}
            placeholder="Nachricht schreiben..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: COLORS.card,
              borderRadius: 20,
              color: COLORS.text,
              borderWidth: 1,
              borderColor: COLORS.border,
              maxHeight: 100,
              fontSize: 15,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={sending || !text.trim()}
            style={{
              marginLeft: 12,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: (sending || !text.trim()) ? COLORS.textMuted : COLORS.orange,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Ionicons name="send" size={22} color={COLORS.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
