import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { ChunkerService } from './chunker/chunker.service';
import { EmbeddingService } from './embedding/embedding.service';
import { IndexerService } from './indexer/indexer.service';
import { RagController } from './rag.controller';
import { RagSearchService } from './search/rag-search.service';
import { VectorStoreService } from './vector-store/vector-store.service';

@Module({
  imports: [ArticleModule],
  controllers: [RagController],
  providers: [
    ChunkerService,
    EmbeddingService,
    VectorStoreService,
    IndexerService,
    RagSearchService,
  ],
  exports: [EmbeddingService, VectorStoreService],
})
export class RagModule {}
