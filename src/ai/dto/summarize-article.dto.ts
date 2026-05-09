import { IsEnum, IsOptional } from 'class-validator';

export class SummarizeArticleDto {
  @IsOptional()
  @IsEnum(['short', 'medium', 'detailed'], {
    message: 'maxLength must be one of: short, medium, detailed',
  })
  maxLength?: 'short' | 'medium' | 'detailed';
}
