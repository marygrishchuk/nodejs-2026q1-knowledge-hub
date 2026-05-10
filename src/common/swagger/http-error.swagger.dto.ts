import { ApiProperty } from '@nestjs/swagger';

/** Matches JSON error bodies from the global HTTP exception filter. */
export class HttpErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;

  @ApiProperty({
    example: 'Authorization header is required',
    description: 'Single message or validation summary',
  })
  message: string | string[];
}
