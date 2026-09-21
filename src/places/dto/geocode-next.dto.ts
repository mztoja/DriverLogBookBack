import { IsArray, IsIn, IsInt } from 'class-validator';

export class GeocodeNextDto {
  @IsArray()
  @IsInt({ each: true })
  excludeIds: number[];
  @IsIn(['full', 'partial'])
  mode: 'full' | 'partial';
}
