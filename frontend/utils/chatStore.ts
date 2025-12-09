// app/frontend/utils/chatStore.ts

import { API_URL } from "../config";
import { getAuthHeaders } from "./api";
import type { ChatMessage } from "../types/chat";

/**
 * Lädt alle Nachrichten für eine Application.
 * Chat ist nur freigeschaltet, wenn application.chatUnlocked = true.
 */
export async function loadMessages(applicationId: string): Promise<ChatMessage[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/chat/messages/${applicationId}`, {
    method: "GET",
    headers,
  });

  if (res.status === 402) {
    throw new Error("CHAT_LOCKED"); // Chat noch nicht bezahlt
  }
  
  if (!res.ok) {
    throw new Error("FAILED_TO_LOAD_MESSAGES");
  }

  const raw = await res.json();
  
  // Normalisiere die Daten: Stelle sicher, dass immer ein "text" Feld existiert
  return raw.map((m: any) => ({
    id: m.id || m._id,
    applicationId: m.applicationId || m.application_id,
    senderId: m.senderId || m.sender_id || m.fromId,
    senderRole: m.senderRole || m.sender_role,
    text: m.text || m.message || m.body || m.content || m.textBody || '',
    createdAt: m.createdAt || m.created_at || m.timestamp,
    timestamp: m.timestamp || m.createdAt || m.created_at,
    read: m.read !== undefined ? m.read : false,
  }));
}

/**
 * Sendet Nachricht.
 */
export async function sendMessage(
  applicationId: string,
  text: string
): Promise<ChatMessage> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/chat/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ applicationId, text }),
  });

  if (res.status === 402) {
    throw new Error("CHAT_LOCKED");
  }

  if (res.status === 422) {
    throw new Error("EMPTY_MESSAGE");
  }

  if (!res.ok) {
    throw new Error("FAILED_TO_SEND_MESSAGE");
  }

  return await res.json();
}

/**
 * Initialer Check ob Chat freigeschaltet ist.
 */
export async function checkChatUnlocked(applicationId: string): Promise<boolean> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) return false;

  const data = await res.json();
  return data.chatUnlocked === true;
}
