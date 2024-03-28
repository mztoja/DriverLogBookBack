import { IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { LogEditDto } from '../../logs/dto/log-edit.dto';
import { serviceTypeEnum } from '../../types';

export class EditServiceDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  logData: LogEditDto;
  @IsEnum(serviceTypeEnum)
  type: serviceTypeEnum;
  @IsString()
  @IsNotEmpty({ message: 'noServiceEntry' })
  entry: string;
}
