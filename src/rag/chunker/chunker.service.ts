import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkerService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor() {
    this.chunkSize = parseInt(process.env.RAG_CHUNK_SIZE ?? '800', 10);
    this.chunkOverlap = parseInt(process.env.RAG_CHUNK_OVERLAP ?? '200', 10);

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error(
        `Invalid RAG configuration: RAG_CHUNK_OVERLAP (${this.chunkOverlap}) must be less than RAG_CHUNK_SIZE (${this.chunkSize})`,
      );
    }
  }

  chunkText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    const step = this.chunkSize - this.chunkOverlap;
    let offset = 0;

    while (offset < text.length) {
      chunks.push(text.slice(offset, offset + this.chunkSize));
      offset += step;
    }

    return chunks;
  }
}
