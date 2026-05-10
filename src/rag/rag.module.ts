import { Module } from '@nestjs/common';
import { ChunkerService } from './chunker/chunker.service';

@Module({
  providers: [ChunkerService],
})
export class RagModule {}
