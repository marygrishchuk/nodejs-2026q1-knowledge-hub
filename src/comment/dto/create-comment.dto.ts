import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty()
  @IsUUID()
  articleId: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  authorId?: string | null;
}
