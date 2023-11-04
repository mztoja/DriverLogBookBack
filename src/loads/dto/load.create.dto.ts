import { LogCreateDto } from '../../logs/dto/log.create.dto';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LoadCreateDto extends LogCreateDto {
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
  @IsNotEmpty({ message: 'weight' })
  weight: number;
  @IsString()
  reference: string;
}
