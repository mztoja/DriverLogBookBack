import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class TourGetNumbersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  tourIds: number[];
}
