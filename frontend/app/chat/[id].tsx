// app/chat/[id].tsx — STABLE WHATSAPP-STYLE CHAT WITH AUTO-REFRESH
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

import { loadMessages, sendMessage, checkChatUnlocked } from "../../utils/chatStore";

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

  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --------------------------------------------
  // LOAD MESSAGES WITH UNLOCK CHECK
  // --------------------------------------------
  async function fetchMessages() {
    try {
      // Prüfe ob Chat unlocked ist
      const isUnlocked = await checkChatUnlocked(applicationId);
      if (!isUnlocked) {
        setLocked(true);
        setLoading(false);
        return;
      }

      // Lade Nachrichten
      const msgs = await loadMessages(applicationId);
      setMessages(msgs);

      // Auto-scroll nach unten
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (err) {
      console.error("❌ Chat load error:", err);
      if (String(err).includes("CHAT_LOCKED")) {
        setLocked(true);
      }
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------
  // MOUNT: LOAD INITIAL + START POLLING
  // --------------------------------------------
  useEffect(() => {
    let mounted = true;

    // Sofort laden beim Mount
    if (mounted) {
      fetchMessages();
    }

    // Polling alle 3 Sekunden
    intervalRef.current = setInterval(() => {
      if (mounted && !locked) {
        fetchMessages();
      }
    }, 3000);

    // Cleanup beim Unmount
    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [applicationId]);

  // --------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------
  async function handleSend() {
    // Blockiere wenn bereits am Senden
    if (sending) return;
    
    // Blockiere wenn leer
    if (!text.trim()) return;

    // Blockiere wenn Chat locked
    if (locked) {
      console.warn("⚠️ Chat ist gesperrt, Senden nicht möglich");
      return;
    }

    try {
      setSending(true);

      const msg = await sendMessage(applicationId, text.trim());
      setMessages((prev) => [...prev, msg]);
      setText("");

      // Scroll nach unten
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (err) {
      console.error("❌ Send error:", err);
      if (String(err).includes("CHAT_LOCKED")) {
        setLocked(true);
      }
    } finally {
      setSending(false);
    }
  }

  // --------------------------------------------
  // UI: Locked Modal
  // --------------------------------------------
  if (locked) {
    return (
      <Modal visible={true} animationType="slide">
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
      </Modal>
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
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={({ item }) => {
          const isOwn = item.senderId === user?.id;

          return (
            <View
              style={{
                padding: 10,
                marginVertical: 4,
                marginHorizontal: 16,
                maxWidth: "80%",
                alignSelf: isOwn ? "flex-end" : "flex-start",
                backgroundColor: isOwn ? COLORS.neon : COLORS.white,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: isOwn ? COLORS.black : COLORS.darkGray }}>
                {item.text}
              </Text>
              <Text style={{ 
                fontSize: 10, 
                color: isOwn ? COLORS.darkGray : COLORS.gray,
                marginTop: 4 
              }}>
                {new Date(item.createdAt).toLocaleTimeString('de-DE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
      />

      {/* INPUT */}
      <SafeAreaView edges={["bottom"]}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          backgroundColor: COLORS.white,
        }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nachricht..."
            style={{
              flex: 1,
              padding: 14,
              backgroundColor: COLORS.gray,
              borderRadius: 12,
            }}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <Pressable
            onPress={handleSend}
            disabled={sending || !text.trim() || locked}
            style={{
              marginLeft: 12,
              padding: 12,
              backgroundColor: (sending || !text.trim() || locked) ? COLORS.gray : COLORS.neon,
              borderRadius: 12,
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Ionicons name="send" size={22} color={COLORS.black} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
