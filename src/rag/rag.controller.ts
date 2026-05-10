import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { IndexerService } from './indexer/indexer.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';

@ApiTags('RAG')
@ApiBearerAuth('Bearer')
@Controller('ai/rag')
export class RagController {
  constructor(private readonly indexerService: IndexerService) {}

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
}
