import { Module } from '@nestjs/common';
import { ArticleModule } from './article/article.module';
import { CategoryModule } from './category/category.module';
import { CommentModule } from './comment/comment.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, CategoryModule, ArticleModule, CommentModule],
})
export class AppModule {}




