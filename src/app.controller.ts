import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root health message',
    description: 'Public — no JWT. Requires `Accept` allowing JSON.',
  })
  @ApiOkResponse({
    schema: { type: 'string', example: 'Hello World!' },
    description: 'Plain text greeting',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
