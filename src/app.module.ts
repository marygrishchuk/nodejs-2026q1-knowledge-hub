import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ArticleModule } from './article/article.module';
import { CategoryModule } from './category/category.module';
import { CommentModule } from './comment/comment.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, CategoryModule, ArticleModule, CommentModule],
  providers: [LoggingMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
