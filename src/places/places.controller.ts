import { BadRequestException, Body, Controller, Inject, Post } from "@nestjs/common";
import { PlacesService } from './places.service';
import { UsersService } from '../users/users.service';

@Controller('place')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}
  @Inject(UsersService)
  usersService: UsersService;

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
