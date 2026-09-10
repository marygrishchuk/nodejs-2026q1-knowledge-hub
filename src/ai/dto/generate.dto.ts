import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateDto {
  @ApiProperty({
    description: 'Free-form user prompt',
    example: 'Explain NestJS dependency injection briefly.',
  })
  @IsNotEmpty({ message: 'prompt is required' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Optional session id returned by a prior /ai/generate call for conversation context',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
