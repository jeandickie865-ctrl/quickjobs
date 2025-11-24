export type ChatSenderRole = 'worker' | 'employer';

export type ChatMessage = {
  id: string;
  applicationId: string;
  senderRole: ChatSenderRole;
  text: string;
  createdAt: string;
};
