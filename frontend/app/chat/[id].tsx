// app/chat/[id].tsx – BACKUP DARK DESIGN
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";

import { loadMessages, sendMessage, checkChatUnlocked } from "../../utils/chatStore";
import { getApplicationById } from "../../utils/applicationStore";

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
  inputBg: '#1C182B',
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
  const [inputFocused, setInputFocused] = useState(false);

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
        if (mounted) setMessages(msgs || []);
      } catch (err) {
        console.log("CHAT ERROR:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadChat();
    intervalRef.current = setInterval(() => {
      if (mounted && isFocused && !locked) loadChat();
    }, 4000);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [applicationId]);

  useEffect(() => {
    if (flatListRef.current) {
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
      console.log("Send error:", err);
      if (String(err).includes("CHAT_LOCKED")) setLocked(true);
    } finally {
      setSending(false);
    }
  }

  // LOCKED STATE
  if (locked) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ padding: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
        </SafeAreaView>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Ionicons name="lock-closed" size={48} color={COLORS.neon} />
          <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "700", marginTop: 12 }}>
            Chat gesperrt
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 6, textAlign: "center" }}>
            Du kannst erst schreiben, nachdem die 20% Provision bezahlt wurde.
          </Text>

          <Pressable
            onPress={() => router.push(`/payment/${applicationId}`)}
            style={{
              backgroundColor: COLORS.purple,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 24,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: "700", color: COLORS.white }}>
              Jetzt freischalten
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // LOADING
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
        <Text style={{ color: COLORS.white, marginTop: 10 }}>Lade Chat...</Text>
      </View>
    );
  }

  // CHAT
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      {/* HEADER */}
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: "700", marginLeft: 12 }}>
            Chat
          </Text>
        </View>
      </SafeAreaView>

      {/* MESSAGES */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item._id || `msg-${index}`}
        renderItem={({ item }) => {
          const isOwn = item.senderId === user.id;

          return (
            <View
              style={{
                padding: 12,
                marginVertical: 4,
                marginHorizontal: 16,
                maxWidth: "75%",
                alignSelf: isOwn ? "flex-end" : "flex-start",
                backgroundColor: isOwn ? COLORS.neon : COLORS.card,
                borderRadius: 16,
                borderWidth: isOwn ? 0 : 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: isOwn ? '#000' : COLORS.white, fontSize: 15 }}>
                {item.text}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 120 }}
      />

      {/* INPUT BAR */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
      }}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setIsTyping(true);
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Nachricht..."
          placeholderTextColor={COLORS.muted}
          style={{
            flex: 1,
            padding: 14,
            backgroundColor: COLORS.inputBg,
            borderRadius: 12,
            color: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={{
            marginLeft: 12,
            padding: 12,
            backgroundColor: sending || !text.trim() ? 'rgba(255,255,255,0.15)' : COLORS.neon,
            borderRadius: 12,
          }}
        >
          <Ionicons name="send" size={22} color={sending || !text.trim() ? COLORS.muted : '#000'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
