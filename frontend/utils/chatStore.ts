// utils/chatStore.ts - Chat Store (REFACTORED)
import { ChatMessage, ChatSenderRole } from '../types/chat';
import { API_BASE, getUserId, getAuthHeaders } from './api';

// ===== GET MESSAGES FOR APPLICATION =====
export async function getMessagesForApplication(applicationId: string): Promise<ChatMessage[]> {
  console.log('🔍 getMessagesForApplication: Fetching messages for', applicationId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/chat/messages/${applicationId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getMessagesForApplication: Failed', response.status, error);
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    
    const messages = await response.json();
    console.log('✅ getMessagesForApplication: Found', messages.length, 'messages');
    return messages;
  } catch (error) {
    console.error('❌ getMessagesForApplication: Error', error);
    throw error;
  }
}

// ===== ADD MESSAGE =====
export async function addMessage(
  applicationId: string,
  senderRole: ChatSenderRole,
  text: string
): Promise<ChatMessage> {
  console.log('➕ addMessage: Sending message', { applicationId, senderRole });
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/chat/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        applicationId,
        senderRole,
        text,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addMessage: Failed', response.status, error);
      throw new Error(`Failed to send message: ${response.status}`);
    }
    
    const message = await response.json();
    console.log('✅ addMessage: Message sent', message.id);
    return message;
  } catch (error) {
    console.error('❌ addMessage: Error', error);
    throw error;
  }
}
