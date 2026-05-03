import { IsEnum, IsOptional } from 'class-validator';

export class AnalyzeArticleDto {
  @IsOptional()
  @IsEnum(['review', 'bugs', 'optimize', 'explain'], {
    message: 'task must be one of: review, bugs, optimize, explain',
  })
  task?: 'review' | 'bugs' | 'optimize' | 'explain';
}
