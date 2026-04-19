import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  login: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.VIEWER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
