import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { API_URL } from "@/config";
import { getAuthHeaders } from "@/utils/api";
import { useLocalSearchParams } from "expo-router";


export default function ChatScreen() {
  const { id: applicationId } = useLocalSearchParams();
  const scrollRef = useRef(null);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const loadMessages = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/chat/messages/${applicationId}`, {
        method: "GET",
        headers,
      });

      const data = await res.json();
      setMessages(data);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);

    } catch (err) {
      console.log("Load Chat Error:", err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);


  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/chat/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          applicationId,
          text,
        }),
      });

      setText("");
      loadMessages();
    } catch (err) {
      console.log("Send Error:", err);
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView ref={scrollRef} style={{ padding: 20 }}>
        {messages.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 30 }}>
            Noch keine Nachrichten. Schreiben Sie die erste Nachricht!
          </Text>
        )}

        {messages.map((m) => {
          const isOwn = m.isOwn;

          return (
            <View
              key={m._id}
              style={{
                alignSelf: isOwn ? "flex-end" : "flex-start",
                backgroundColor: isOwn ? "#5941FF" : "#E5E5E5",
                padding: 10,
                borderRadius: 10,
                marginVertical: 6,
                maxWidth: "80%",
              }}
            >
              <Text style={{ color: isOwn ? "white" : "black" }}>
                {m.text}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          padding: 10,
          borderTopWidth: 1,
          borderColor: "#ccc",
          alignItems: "center",
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: "#f0f0f0",
            padding: 12,
            borderRadius: 20,
          }}
          placeholder="Nachricht schreiben..."
          value={text}
          onChangeText={setText}
        />

        <Pressable
          onPress={sendMessage}
          style={{
            backgroundColor: "#5941FF",
            padding: 12,
            marginLeft: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white" }}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}
