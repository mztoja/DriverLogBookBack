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
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthVerifyResetCodeDto } from './dto/auth-verify-reset-code.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UsePipes(new ValidationPipe(), new CheckPasswordPipe())
  async login(
    @Body() loginDto: AuthLoginDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<Omit<UserInterface, 'pwdHash'>> {
    return this.authService.login(loginDto, res, req);
  }

  @Post('/refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    return this.authService.refresh(req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  async user(@Req() request: Request, @UserObj() user: UserEntity) {
    delete user.pwdHash;
    delete user.refreshToken;
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  async logout(@UserObj() user: UserEntity, @Res() res: Response) {
    return this.authService.logout(user, res);
  }

  @Post('/forgotPassword')
  @UsePipes(new ValidationPipe())
  async forgotPassword(@Body() dto: AuthForgotPasswordDto): Promise<{ success: boolean }> {
    await this.authService.forgotPassword(dto.email);
    return { success: true };
  }

  @Post('/verifyResetCode')
  @UsePipes(new ValidationPipe())
  async verifyResetCode(@Body() dto: AuthVerifyResetCodeDto): Promise<{ success: boolean }> {
    await this.authService.verifyResetCode(dto.email, dto.code);
    return { success: true };
  }

  @Post('/resetPassword')
  @UsePipes(new ValidationPipe(), new CheckPasswordPipe())
  async resetPassword(@Body() dto: AuthResetPasswordDto): Promise<{ success: boolean }> {
    await this.authService.resetPassword(dto.email, dto.code, dto.password);
    return { success: true };
  }
}
