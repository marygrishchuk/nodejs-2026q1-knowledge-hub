import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
