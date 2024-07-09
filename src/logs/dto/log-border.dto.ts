import { LogCreateDto } from './log-create.dto';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class LogBorderDto extends LogCreateDto {
  @Transform(({ obj }) => obj.addNewBorder === 'true')
  @IsBoolean()
  addNewBorder: boolean;
}
