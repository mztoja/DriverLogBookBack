import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticationService } from '../authentication/authentication.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}
  @Inject(UsersService)
  private usersService: UsersService;
  @Inject(JwtService)
  private jwtService: JwtService;
  @Inject(AuthenticationService)
  private authenticationService: AuthenticationService;

  @Get('/')
  async getPlaces(@Req() request: Request) {
    const user = await this.authenticationService.findByCookie(
      request.cookies['jwt'],
    );
    if (!user) {
      throw new BadRequestException('user not exist');
    }
    return await this.placesService.findAll(user.id);
  }

  @Post('create')
  async create(
    @Body('userId') userId: string,
    @Body('isFavorite') isFavorite: string,
    @Body('type') type: string,
    @Body('name') name: string,
    @Body('street') street: string,
    @Body('code') code: string,
    @Body('city') city: string,
    @Body('country') country: string,
    @Body('lat') lat: string,
    @Body('lon') lon: string,
    @Body('description') description: string,
    @Body('mark') mark: string,
  ) {
    if (name.length < 1) {
      throw new BadRequestException('place name not specified');
    }
    if (city.length < 1) {
      throw new BadRequestException('city not specified');
    }
    if (country === undefined) {
      throw new BadRequestException('country not specified');
    }
    const place = await this.placesService.create({
      userId,
      isFavorite: Boolean(Number(isFavorite)),
      type: Number(type),
      name,
      street,
      code,
      city,
      country,
      lat,
      lon,
      description: description !== '' ? description : null,
    });
    if (place) {
      const isMarked = Boolean(Number(mark));
      if (isMarked) {
        await this.usersService.markDepart(userId, place.id);
      }
      return {
        message: 'place created',
      };
    }
  }
}