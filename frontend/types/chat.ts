// app/frontend/types/chat.ts

export interface ChatMessage {
  id?: string;
  applicationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type ChatSenderRole = 'worker' | 'employer';
