import { ApiProperty } from '@nestjs/swagger';

export class RagChatSourceDto {
  @ApiProperty()
  articleId: string;

  @ApiProperty()
  articleTitle: string;

  @ApiProperty()
  relevantChunk: string;
}

export class RagChatResponseDto {
  @ApiProperty()
  answer: string;

  @ApiProperty({ type: [RagChatSourceDto] })
  sources: RagChatSourceDto[];

  @ApiProperty()
  conversationId: string;
}

export class ConversationMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @ApiProperty()
  content: string;
}
