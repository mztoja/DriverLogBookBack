import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { LogEditDto } from '../../logs/dto/log-edit.dto';

export class LoadEditDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  loadingLogData: LogEditDto;
  @ValidateNested({ each: true })
  unloadingLogData: LogEditDto;
  @IsString()
  @IsNotEmpty({ message: 'vehicle' })
  vehicle: string;
  @IsNumber()
  senderId: number;
  @IsNumber()
  receiverId: number;
  @IsString()
  description: string;
  @IsString()
  quantity: string;
  @IsNumber()
  @Min(1, { message: 'weight' })
  @IsNotEmpty({ message: 'weight' })
  weight: number;
  @IsString()
  reference: string;
  @IsNumber()
  distance: number;
}
