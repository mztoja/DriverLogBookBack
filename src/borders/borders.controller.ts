import { Body, Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { BordersService } from './borders.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserObj } from 'src/decorators/user-obj.decorator';
import { UserEntity } from 'src/users/user.entity';
import { BorderDeleteDto } from './dto/border-delete.dto';
import { BorderEntity } from './border.entity';
import { DeleteResult } from 'typeorm';

@Controller('borders')
export class BordersController {
  constructor(private readonly bordersService: BordersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('getByCountry/:country')
  async getByCountry(
    @Param('country') country: string,
    @UserObj() user: UserEntity): Promise<BorderEntity[]> {
    return await this.bordersService.getByCountry(country, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async delete(@Body() data: BorderDeleteDto, @UserObj() user: UserEntity): Promise<DeleteResult> {
    return await this.bordersService.delete(data.id, user.id);
  }
}
