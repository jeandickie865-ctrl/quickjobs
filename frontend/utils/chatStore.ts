import { getItem, setItem } from './storage';
import { ChatMessage, ChatSenderRole } from '../types/chat';

const CHAT_KEY = '@shiftmatch:chatMessages';

async function loadAll(): Promise<ChatMessage[]> {
  return (await getItem<ChatMessage[]>(CHAT_KEY)) ?? [];
}

async function saveAll(messages: ChatMessage[]): Promise<void> {
  await setItem(CHAT_KEY, messages);
}

export async function getMessagesForApplication(applicationId: string): Promise<ChatMessage[]> {
  const all = await loadAll();
  return all
    .filter(m => m.applicationId === applicationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addMessage(
  applicationId: string,
  senderRole: ChatSenderRole,
  text: string,
): Promise<ChatMessage> {
  const all = await loadAll();
  const msg: ChatMessage = {
    id: 'msg-' + Date.now().toString() + '-' + Math.random().toString(36).slice(2),
    applicationId,
    senderRole,
    text,
    createdAt: new Date().toISOString(),
  };
  const next = [...all, msg];
  await saveAll(next);
  return msg;
}
