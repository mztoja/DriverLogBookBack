import { IsBoolean } from 'class-validator';
import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { Transform } from 'class-transformer';

export class DayCreateDto extends LogCreateDto {
  @Transform(({ obj }) => obj.doubleCrew === 'true')
  @IsBoolean()
  doubleCrew: boolean;
  @Transform(({ obj }) => obj.cardInserted === 'true')
  @IsBoolean()
  cardInserted: boolean;
}
