import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateArticleDto {
  @ApiProperty({
    example: 'Spanish',
    description: 'Target language name',
  })
  @IsNotEmpty({ message: 'targetLanguage is required' })
  @IsString()
  targetLanguage: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Optional source language; omit for auto-detection',
  })
  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
