import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ArticleModule } from '../article/article.module';
import { RagChatService } from './chat/rag-chat.service';
import { ChunkerService } from './chunker/chunker.service';
import { ConversationStoreService } from './conversation/conversation-store.service';
import { EmbeddingService } from './embedding/embedding.service';
import { IndexerService } from './indexer/indexer.service';
import { RagController } from './rag.controller';
import { RagSearchService } from './search/rag-search.service';
import { VectorStoreService } from './vector-store/vector-store.service';

@Module({
  imports: [ArticleModule, AiModule],
  controllers: [RagController],
  providers: [
    ChunkerService,
    EmbeddingService,
    VectorStoreService,
    IndexerService,
    RagSearchService,
    RagChatService,
    ConversationStoreService,
  ],
  exports: [EmbeddingService, VectorStoreService],
})
export class RagModule {}
