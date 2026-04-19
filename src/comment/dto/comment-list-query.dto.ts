import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class CommentListQueryDto extends ListQueryDto {
  @ApiProperty()
  @IsUUID()
  articleId: string;
}
