import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { serviceTypeEnum } from '../../types';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto extends LogCreateDto {
  @IsEnum(serviceTypeEnum)
  serviceType: number;
  @IsNumber()
  @Min(1, { message: 'chooseServicedVehicle' })
  serviceVehicleId: number;
  @IsString()
  @IsNotEmpty({ message: 'noServiceEntry' })
  serviceEntry: string;
}
