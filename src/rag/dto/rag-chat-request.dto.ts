import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RagChatRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
