import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { emailRegExp, passwordRegExp } from '../config/regexp';
import { PlacesService } from '../places/places.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private jwtService: JwtService,
  ) {}
  @Inject(PlacesService)
  placesService: PlacesService;

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('lang') lang: string,
    @Body('companyName') companyName: string,
    @Body('companyStreet') companyStreet: string,
    @Body('companyPostCode') companyPostCode: string,
    @Body('companyCity') companyCity: string,
    @Body('country') country: string,
    @Body('defaultCustomer') customer: string,
    @Body('bidType') bidType: string,
    @Body('amount') bid: string,
    @Body('currency') currency: string,
    @Body('fuelConsumptionType') fuelConType: string,
  ) {
    if (!emailRegExp().test(email)) {
      throw new BadRequestException('invalid email');
    }
    if (!passwordRegExp().test(password)) {
      throw new BadRequestException('invalid password');
    }
    if (companyName.length < 1) {
      throw new BadRequestException('company name not specified');
    }
    if (companyCity.length < 1) {
      throw new BadRequestException('city not specified');
    }
    if (country === undefined) {
      throw new BadRequestException('country not specified');
    }
    const checkUser = await this.authenticationService.findOne({
      where: { email: email },
    });
    if (checkUser) {
      throw new BadRequestException('email exist');
    }
    const place = await this.placesService.create({
      userId: '',
      isFavorite: false,
      type: 1,
      name: companyName,
      street: companyStreet,
      code: companyPostCode,
      city: companyCity,
      country,
      lat: '',
      lon: '',
      description: null,
    });
    if (!place) {
      throw new BadRequestException('place not created');
    }
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await this.authenticationService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      lang: Number(lang),
      country,
      customer,
      bidType: Number(bidType),
      bid: Number(bid),
      currency,
      fuelConType: Number(fuelConType),
      companyId: place.id,
    });
    await this.placesService.setUserId(place.id, user.id);
    delete user.password;
    return user;
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authenticationService.findOne({
      where: { email: email },
    });
    if (!user) {
      throw new BadRequestException('invalid credentials');
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('invalid credentials');
    }

    const jwt = await this.jwtService.signAsync({ id: user.id });
    response.cookie('jwt', jwt, { httpOnly: true });
    return {
      message: 'success',
    };
  }

  @Get('user')
  async user(@Req() request: Request) {
    try {
      const cookie = request.cookies['jwt'];
      const data = await this.jwtService.verifyAsync(cookie);
      if (!data) {
        throw new UnauthorizedException();
      }
      const user = await this.authenticationService.findOne({
        where: { id: data['id'] },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;
      return safeUser;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    return {
      message: 'success',
    };
  }
}
