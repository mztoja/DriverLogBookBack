import { Controller } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('log')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}
}
