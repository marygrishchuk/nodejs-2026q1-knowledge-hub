import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiCacheService } from './cache/ai-cache.service';
import { GeminiService } from './gemini/gemini.service';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { AiSessionService } from './session/ai-session.service';
import { AiUsageService } from './tracking/ai-usage.service';
import { AiOutputValidator } from './validators/ai-output.validator';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    AiCacheService,
    AiUsageService,
    AiRateLimitGuard,
    AiOutputValidator,
    AiSessionService,
  ],
  exports: [AiService],
})
export class AiModule {}
