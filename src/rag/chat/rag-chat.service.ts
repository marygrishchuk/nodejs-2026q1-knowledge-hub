import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../ai/gemini/gemini.service';
import { ConversationStoreService } from '../conversation/conversation-store.service';
import { RagChatRequestDto } from '../dto/rag-chat-request.dto';
import { RagChatResponseDto } from '../dto/rag-chat-response.dto';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { SearchResult } from '../vector-store/vector-store.types';

const TOP_CHUNKS_LIMIT = 5;

@Injectable()
export class RagChatService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly geminiService: GeminiService,
    private readonly conversationStore: ConversationStoreService,
  ) {}

  async chat(dto: RagChatRequestDto): Promise<RagChatResponseDto> {
    const conversationId = this.conversationStore.getOrCreate(
      dto.conversationId,
    );

    const queryVector = await this.embeddingService.embedText(dto.question);
    const topChunks = await this.vectorStoreService.search(
      queryVector,
      TOP_CHUNKS_LIMIT,
    );

    const history = this.conversationStore.getHistory(conversationId);
    const prompt = this.buildPrompt(dto.question, topChunks, history);

    const geminiResponse = await this.geminiService.generateContent(prompt);
    const answer = this.geminiService.extractText(geminiResponse);

    this.conversationStore.addMessages(conversationId, dto.question, answer);

    return {
      answer,
      sources: topChunks.map((chunk) => ({
        articleId: chunk.payload.articleId,
        articleTitle: chunk.payload.articleTitle,
        relevantChunk: chunk.payload.chunkText,
      })),
      conversationId,
    };
  }

  private buildPrompt(
    question: string,
    chunks: SearchResult[],
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): string {
    const contextSection = chunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1}] ${chunk.payload.articleTitle}\n${chunk.payload.chunkText}`,
      )
      .join('\n\n');

    const historySection =
      history.length > 0
        ? history
            .map(
              (message) =>
                `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`,
            )
            .join('\n')
        : '';

    const parts = [
      'You are a helpful assistant that answers questions based on the provided knowledge base articles.',
      'Use only the information from the sources below to answer. If the answer is not in the sources, say so.',
      '',
      'SOURCES:',
      contextSection,
    ];

    if (historySection) {
      parts.push('', 'CONVERSATION HISTORY:', historySection);
    }

    parts.push('', `User: ${question}`, 'Assistant:');

    return parts.join('\n');
  }
}
