import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}


