import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationStoreService } from './conversation/conversation-store.service';
import { IndexerService } from './indexer/indexer.service';
import { RagChatService } from './chat/rag-chat.service';
import { RagSearchService } from './search/rag-search.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import { RagSearchResponseDto } from './dto/rag-search-response.dto';
import { RagChatRequestDto } from './dto/rag-chat-request.dto';
import {
  ConversationMessageDto,
  RagChatResponseDto,
} from './dto/rag-chat-response.dto';

@ApiTags('RAG')
@ApiBearerAuth('Bearer')
@Controller('ai/rag')
export class RagController {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly ragSearchService: RagSearchService,
    private readonly ragChatService: RagChatService,
    private readonly conversationStore: ConversationStoreService,
  ) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Index Knowledge Hub articles into vector storage' })
  @ApiResponse({ status: 200, type: ReindexResponseDto })
  @ApiResponse({ status: 503, description: 'Vector DB or Gemini unavailable' })
  async index(@Body() dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    return this.indexerService.indexArticles(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove article vectors from index' })
  @ApiParam({ name: 'articleId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Vectors removed' })
  @ApiResponse({ status: 404, description: 'Article not found in index' })
  @ApiResponse({ status: 503, description: 'Vector DB unavailable' })
  async deleteArticleFromIndex(
    @Param('articleId') articleId: string,
  ): Promise<void> {
    await this.indexerService.deleteArticleVectors(articleId);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Semantic search over indexed article chunks' })
  @ApiResponse({ status: 200, type: RagSearchResponseDto })
  @ApiResponse({ status: 400, description: 'Missing required query field' })
  @ApiResponse({ status: 503, description: 'Vector DB or Gemini unavailable' })
  async search(
    @Body() dto: RagSearchRequestDto,
  ): Promise<RagSearchResponseDto> {
    return this.ragSearchService.search(dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with Knowledge Hub RAG' })
  @ApiResponse({ status: 200, type: RagChatResponseDto })
  @ApiResponse({ status: 400, description: 'Missing required question field' })
  @ApiResponse({ status: 503, description: 'Vector DB or Gemini unavailable' })
  async chat(@Body() dto: RagChatRequestDto): Promise<RagChatResponseDto> {
    return this.ragChatService.chat(dto);
  }

  @Get('chat/:conversationId/history')
  @ApiOperation({ summary: 'Get RAG conversation history' })
  @ApiParam({ name: 'conversationId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ConversationMessageDto] })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getConversationHistory(
    @Param('conversationId') conversationId: string,
  ): ConversationMessageDto[] {
    if (!this.conversationStore.exists(conversationId)) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    return this.conversationStore.getHistory(conversationId);
  }
}
