import { IntersectionType } from '@nestjs/mapped-types';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { FilterArticleDto } from './filter-article.dto';

export class ArticleListQueryDto extends IntersectionType(
  FilterArticleDto,
  ListQueryDto,
) {}
