import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateArticleDto {
  @IsNotEmpty({ message: 'targetLanguage is required' })
  @IsString()
  targetLanguage: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
