import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { PlaceCreateDto } from './dto/place-create.dto';
import { UsersService } from '../users/users.service';
import { PlaceEntity } from './place.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PlaceEditDto } from './dto/place-edit.dto';
import { UpdateResult } from 'typeorm';

@Controller('places')
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getPlacesList(@UserObj() user: UserEntity): Promise<PlaceEntity[]> {
    return await this.placesService.getPlacesList(user.id);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('companyList')
  async getCompanyList(@UserObj() user: UserEntity): Promise<PlaceEntity[]> {
    return await this.placesService.getCompanyList(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('edit/:id')
  async editPlace(
    @UserObj() user: UserEntity,
    @Body() body: PlaceEditDto,
    @Param('id') id: string,
  ): Promise<UpdateResult> {
    const place = await this.placesService.findById(Number(id));
    if (!place || place.userId !== user.id) {
      throw new BadRequestException();
    }
    return await this.placesService.edit(place.id, body);
  }
}
