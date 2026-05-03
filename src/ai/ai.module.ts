import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiCacheService } from './cache/ai-cache.service';
import { GeminiService } from './gemini/gemini.service';
import { AiUsageService } from './tracking/ai-usage.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [AiService, GeminiService, AiCacheService, AiUsageService],
  exports: [AiService],
})
export class AiModule {}
