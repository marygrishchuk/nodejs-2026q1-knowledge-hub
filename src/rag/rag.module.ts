import { Module } from '@nestjs/common';
import { ChunkerService } from './chunker/chunker.service';
import { EmbeddingService } from './embedding/embedding.service';

@Module({
  providers: [ChunkerService, EmbeddingService],
  exports: [EmbeddingService],
})
export class RagModule {}
