import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class LoadCreateDto extends LogCreateDto {
  @IsString()
  @IsNotEmpty({ message: 'vehicle' })
  vehicle: string;
  @IsNumber()
  senderId: number;
  @IsNumber()
  receiverId: number;
  @IsString()
  @IsNotEmpty({ message: 'description' })
  description: string;
  @IsString()
  quantity: string;
  @IsNumber()
  @Min(1, { message: 'weight' })
  @IsNotEmpty({ message: 'weight' })
  weight: number;
  @IsString()
  reference: string;
}
