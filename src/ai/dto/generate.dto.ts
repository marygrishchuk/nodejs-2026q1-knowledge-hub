import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateDto {
  @IsNotEmpty({ message: 'prompt is required' })
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
