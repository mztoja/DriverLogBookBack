import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { PlaceCreateDto } from './dto/place.create.dto';
import { UsersService } from '../users/users.service';
import { PlaceEntity } from './place.entity';

@Controller('places')
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  async getPlacesList(@UserObj() user: UserEntity): Promise<PlaceEntity[]> {
    return await this.placesService.getPlacesList(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(
    @Body() body: PlaceCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<PlaceEntity> {
    return await this.placesService.create(
      body,
      user.id,
      this.usersService.markDepart.bind(this.usersService),
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('companyList')
  async getCompanyList(@UserObj() user: UserEntity): Promise<PlaceEntity[]> {
    return await this.placesService.getCompanyList(user.id);
  }
}
