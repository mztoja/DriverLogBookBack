import { BadRequestException, Body, Controller, Get, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private jwtService: JwtService,
  ) {}
  @Post('register')
  async register(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body('email') email: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body('password') password: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body('name') name: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body('lang') lang: string,


  ) {
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await this.authenticationService.create({
      name,
      email,
      password: hashedPassword,
      lang,
    });
    delete user.password;
    return user;
  }
  @Post('login')
  async login(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body('email') email: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
