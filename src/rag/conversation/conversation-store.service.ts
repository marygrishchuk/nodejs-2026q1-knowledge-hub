import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConversationStoreService {
  private readonly conversations: {
    [conversationId: string]: ConversationMessage[];
  } = {};

  private readonly maxMessages: number;

  constructor() {
    this.maxMessages = parseInt(
      process.env.RAG_CONVERSATION_MAX_MESSAGES ?? '20',
      10,
    );
  }

  getOrCreate(conversationId?: string): string {
    if (conversationId) {
      if (!this.conversations[conversationId]) {
        this.conversations[conversationId] = [];
      }
      return conversationId;
    }

    const newId = randomUUID();
    this.conversations[newId] = [];
    return newId;
  }

  addMessages(
    conversationId: string,
    userMessage: string,
    assistantMessage: string,
  ): void {
    const history = this.conversations[conversationId];
    if (!history) {
      return;
    }

    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: assistantMessage });

    if (history.length > this.maxMessages) {
      this.conversations[conversationId] = history.slice(-this.maxMessages);
    }
  }

  getHistory(conversationId: string): ConversationMessage[] {
    return this.conversations[conversationId] ?? [];
  }

  exists(conversationId: string): boolean {
    return conversationId in this.conversations;
  }
}
