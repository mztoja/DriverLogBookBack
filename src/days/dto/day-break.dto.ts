import { IsIn, IsString } from 'class-validator';
import { LogCreateDto } from '../../logs/dto/log-create.dto';

export class DayBreakDto extends LogCreateDto {
  @IsString()
  driveTime: string; // hh:mm do dopisania do driveTime/driveTime2 dnia (i trasy)
  @IsIn([1, 2])
  slot: number; // 1 -> driveTime, 2 -> driveTime2
  @IsIn(['break', 'changeSlot1', 'changeSlot2'])
  scenario: 'break' | 'changeSlot1' | 'changeSlot2'; // decyduje wyłącznie o logTypeEnum nowego wpisu
}
