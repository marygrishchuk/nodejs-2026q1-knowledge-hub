import { Module } from '@nestjs/common';
import { ChunkerService } from './chunker/chunker.service';
import { EmbeddingService } from './embedding/embedding.service';
import { VectorStoreService } from './vector-store/vector-store.service';

@Module({
  providers: [ChunkerService, EmbeddingService, VectorStoreService],
  exports: [EmbeddingService, VectorStoreService],
})
export class RagModule {}
