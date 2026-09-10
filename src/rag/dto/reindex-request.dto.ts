import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ReindexRequestDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  onlyPublished?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  articleIds?: string[];
}
