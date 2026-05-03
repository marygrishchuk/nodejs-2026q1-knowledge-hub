import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { SummarizeArticleResponse } from './interfaces/ai-responses.interface';

@Controller('ai')
@UseGuards(AiRateLimitGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('articles/:articleId/summarize')
  async summarizeArticle(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    return this.aiService.summarizeArticle(articleId, dto);
  }
}
