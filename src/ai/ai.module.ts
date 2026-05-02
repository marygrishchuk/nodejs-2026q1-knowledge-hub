import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
