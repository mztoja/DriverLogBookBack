import { LogCreateDto } from './log-create.dto';
import { IsString } from 'class-validator';

export class LogDetachTrailerDto extends LogCreateDto {
  @IsString()
  unloadAction: string;
}
