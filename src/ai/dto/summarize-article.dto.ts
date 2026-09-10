import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class SummarizeArticleDto {
  @ApiPropertyOptional({
    enum: ['short', 'medium', 'detailed'],
    default: 'medium',
    description: 'Desired summary length',
  })
  @IsOptional()
  @IsEnum(['short', 'medium', 'detailed'], {
    message: 'maxLength must be one of: short, medium, detailed',
  })
  maxLength?: 'short' | 'medium' | 'detailed';
}
