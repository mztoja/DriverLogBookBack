import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { AuthLoginDto } from './dto/auth-login.dto';
import { CheckPasswordPipe } from '../pipes/check-password.pipe';
import { UserInterface } from '../types';
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UsePipes(new ValidationPipe(), new CheckPasswordPipe())
  async login(
    @Body() loginDto: AuthLoginDto,
    @Res() res: Response,
  ): Promise<Omit<UserInterface, 'pwdHash'>> {
    return this.authService.login(loginDto, res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/user')
  async user(@Req() request: Request, @UserObj() user: UserEntity) {
    delete user.pwdHash;
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/logout')
  async logout(@UserObj() user: UserEntity, @Res() res: Response) {
    return this.authService.logout(user, res);
  }
}
