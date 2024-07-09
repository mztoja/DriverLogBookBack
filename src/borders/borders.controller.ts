import { Controller, Get, Param } from '@nestjs/common';
import { BordersService } from './borders.service';

@Controller('borders')
export class BordersController {
  constructor(private readonly bordersService: BordersService) {}

  @Get('getByCountry/:country')
  async getByCountry(@Param('country') country: string) {
    return await this.bordersService.getByCountry(country);
  }
}
