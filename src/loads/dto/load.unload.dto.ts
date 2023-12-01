import { LogCreateDto } from '../../logs/dto/log.create.dto';
import { IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoadUnloadDto extends LogCreateDto {
  @IsNumber()
  @Min(1, { message: 'loadId' })
  loadId: number;
  @Transform(({ obj }) => obj.isPlaceAsReceiver === 'true')
  @IsBoolean()
  isPlaceAsReceiver: boolean;
}
