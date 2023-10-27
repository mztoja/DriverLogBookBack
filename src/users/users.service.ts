import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserRegisterDto } from './dto/user.register.dto';
import { placeTypeEnum } from '../types';
import { PlacesService } from '../places/places.service';
import { hashPwd } from '../utlis/hash-pwd';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private placesService: PlacesService,
  ) {}

  async register(
    userDto: UserRegisterDto,
  ): Promise<Omit<UserEntity, 'pwdHash'>> {
    const checkUser = await this.usersRepository.findOne({
      where: { email: userDto.email },
    });

    if (checkUser) {
      throw new BadRequestException('email exist');
    }

    const place = await this.placesService.create({
      isFavorite: false,
      type: placeTypeEnum.base,
      name: userDto.companyName,
      street: userDto.companyStreet,
      code: userDto.companyPostCode,
      city: userDto.companyCity,
      country: userDto.country,
      lat: 0,
      lon: 0,
      description: null,
    });
    const pwdHash = hashPwd(userDto.password);
    const user = await this.usersRepository.save({
      email: userDto.email,
      pwdHash,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      lang: userDto.lang,
      country: userDto.country,
      customer: userDto.defaultCustomer,
      bidType: userDto.bidType,
      bid: userDto.bid,
      currency: userDto.currency,
      fuelConType: userDto.fuelConsumptionType,
      companyId: place.id,
    });
    await this.placesService.setUserId(place.id, user.id);
    delete user.pwdHash;
    return user;
  }

  async markDepart(userId: string, placeId: number): Promise<void> {
    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        markedDepart: placeId,
      },
    );
  }
}
