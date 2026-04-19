import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ArticleStatus } from '../../common/enums';

export class FilterArticleDto {
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
