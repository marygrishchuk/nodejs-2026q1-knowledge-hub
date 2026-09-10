import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class AnalyzeArticleDto {
  @ApiPropertyOptional({
    enum: ['review', 'bugs', 'optimize', 'explain'],
    default: 'review',
    description: 'Analysis focus',
  })
  @IsOptional()
  @IsEnum(['review', 'bugs', 'optimize', 'explain'], {
    message: 'task must be one of: review, bugs, optimize, explain',
  })
  task?: 'review' | 'bugs' | 'optimize' | 'explain';
}
