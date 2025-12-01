// app/chat/[id].tsx — FINAL WHATSAPP-STYLE CHAT
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

import { loadMessages, sendMessage, checkChatUnlocked } from "../../utils/chatStore";
import { getApplicationById } from "../../utils/applicationStore";

const COLORS = {
  purple: "#5941FF",
  neon: "#C8FF16",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#DDDDDD",
  darkGray: "#333333",
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.id as string;

  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --------------------------------------------
  // LOAD CHAT INITIAL + AUTO-REFRESH
  // --------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function loadChat() {
      try {
        console.log("CHAT → loadChat() gestartet", applicationId);

        // 1. Unlock-Check
        const isUnlocked = await checkChatUnlocked(applicationId);
        console.log("CHAT → isUnlocked:", isUnlocked);

        if (!isUnlocked) {
          setLocked(true);
          setLoading(false);
          return;
        }

        // 2. Messages laden
        const msgs = await loadMessages(applicationId);
        console.log("CHAT → messages loaded:", msgs);

        if (mounted) {
          setMessages(msgs || []);
        }

      } catch (err) {
        console.log("CHAT ERROR:", err);
        console.log("CHAT ERROR RESPONSE:", err?.response?.data);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadChat();

    intervalRef.current = setInterval(() => {
      if (mounted && !locked) loadChat();
    }, 4000);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [applicationId, locked]);

  // --------------------------------------------
  // AUTO SCROLL TO BOTTOM
  // --------------------------------------------
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages]);

  // --------------------------------------------
  // TYPING TIMEOUT - Reset nach 800ms Pause
  // --------------------------------------------
  useEffect(() => {
    if (!isTyping) return;
    const timeout = setTimeout(() => setIsTyping(false), 800);
    return () => clearTimeout(timeout);
  }, [isTyping]);

  // --------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------
  async function handleSend() {
    if (sending) return;
    if (!text.trim()) return;
    if (locked) return;

    try {
      setSending(true);

      const msg = await sendMessage(applicationId, text.trim());
      setMessages((prev) => [...prev, msg]);
      setText("");

    } catch (err) {
      console.log("Send error:", err);
      if (String(err).includes("CHAT_LOCKED")) {
        setLocked(true);
      }
    } finally {
      setSending(false);
    }
  }

  // --------------------------------------------
  // UI: Locked state
  // --------------------------------------------
  if (locked) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
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
          <Text style={{ color: COLORS.white, marginTop: 6, textAlign: "center" }}>
            Du kannst erst schreiben, nachdem die 20% Provision bezahlt wurde.
          </Text>

          <Pressable
            onPress={() => router.push(`/payment/${applicationId}`)}
            style={{
              backgroundColor: COLORS.neon,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text style={{ fontWeight: "700", color: COLORS.black }}>
              Jetzt freischalten
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --------------------------------------------
  // UI: Loading
  // --------------------------------------------
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
        <Text style={{ color: COLORS.white, marginTop: 10 }}>Lade Chat...</Text>
      </View>
    );
  }

  // --------------------------------------------
  // UI: Chat
  // --------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.purple }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* HEADER */}
      <SafeAreaView edges={["top"]}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16
        }}>
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
                padding: 10,
                marginVertical: 4,
                maxWidth: "80%",
                alignSelf: isOwn ? "flex-end" : "flex-start",
                backgroundColor: isOwn ? COLORS.neon : COLORS.white,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: isOwn ? COLORS.black : COLORS.darkGray }}>
                {item.text}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      />

      {/* INPUT */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: COLORS.white,
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
          style={{
            flex: 1,
            padding: 14,
            backgroundColor: COLORS.gray,
            borderRadius: 12,
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={{
            marginLeft: 12,
            padding: 12,
            backgroundColor: sending ? COLORS.gray : COLORS.neon,
            borderRadius: 12,
          }}
        >
          <Ionicons name="send" size={22} color={COLORS.black} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
