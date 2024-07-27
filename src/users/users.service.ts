import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserRegisterDto } from './dto/user-register.dto';
import { placeTypeEnum, userLangEnum } from '../types';
import { PlacesService } from '../places/places.service';
import { hashPwd } from '../utlis/hash-pwd';
import { UserUpdateDto } from './dto/user-update.dto';
import { MailService } from '../mail/mail.service';
import { registeredEmailTemplate } from '../templates/email/registered';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Inject(PlacesService)
    private placesService: PlacesService,
    @Inject(MailService)
    private mailService: MailService,
  ) {}

  async register(
    userDto: UserRegisterDto,
  ): Promise<Omit<UserEntity, 'pwdHash'>> {
    try {
      const pwdHash = hashPwd(userDto.password);
      const user = await this.userRepository.save({
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
        companyId: 0,
      });

      const place = await this.placesService.create(
        {
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
          isMarked: false,
        },
        user.id,
        this.markDepart.bind,
      );
      await this.userRepository.update(
        { id: user.id },
        { companyId: place.id },
      );
      delete user.pwdHash;
      await this.mailService.sendMail(
        user.email,
        user.lang === userLangEnum.pl
          ? 'Rejestracja zakończona pomyślnie!'
          : 'Registration completed successfully!'
        ,
        registeredEmailTemplate(user.lang)
      );
      return user;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async markDepart(userId: string, placeId: number) {
    try {
      await this.userRepository.update(
        { id: userId },
        { markedDepart: placeId },
      );
      return placeId;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async editNotes(userId: string, notes: string): Promise<UserEntity> {
    await this.userRepository.update({ id: userId }, { notes });
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async markArrival(userId: string, placeId: number) {
    try {
      await this.userRepository.update(
        { id: userId },
        { markedArrive: placeId },
      );
      return placeId;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async countryEnter(userId: string, country: string) {
    try {
      await this.userRepository.update({ id: userId }, { country });
      return country;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async find(email: string) {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async update(
    userId: string,
    user: UserUpdateDto,
    noActiveRoute: boolean,
    pervCurrency: string,
  ): Promise<UserEntity> {
    await this.userRepository.update(
      { id: userId },
      {
        firstName: user.firstName,
        lastName: user.lastName,
        lang: user.lang,
        companyId: user.companyId,
        customer: user.customer,
        bidType: user.bidType,
        bid: user.bid,
        fuelConType: user.fuelConsumptionType,
        currency: noActiveRoute ? user.currency : pervCurrency,
      },
    );
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
