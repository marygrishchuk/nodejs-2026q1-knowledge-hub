import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Session {
  id: string;
  messages: ConversationMessage[];
  createdAt: number;
  lastAccessedAt: number;
}

@Injectable()
export class AiSessionService {
  private sessions = new Map<string, Session>();
  private readonly maxHistoryLength = 10;
  private readonly sessionTTLMs = 3600000;

  constructor() {
    this.startCleanupInterval();
  }

  createSession(): string {
    const sessionId = randomUUID();
    this.sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
    return sessionId;
  }

  addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    session.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    if (session.messages.length > this.maxHistoryLength) {
      session.messages = session.messages.slice(-this.maxHistoryLength);
    }

    session.lastAccessedAt = Date.now();
  }

  getHistory(sessionId: string): Array<{ role: 'user' | 'assistant'; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    session.lastAccessedAt = Date.now();

    return session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  sessionExists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastAccessedAt > this.sessionTTLMs) {
          this.sessions.delete(sessionId);
        }
      }
    }, 300000);
  }
}
