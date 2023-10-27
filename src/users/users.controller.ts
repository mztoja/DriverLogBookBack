import {
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRegisterDto } from './dto/user.register.dto';
import { UserInterface } from '../types';
import { CheckPasswordPipe } from '../pipes/check-password.pipe';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  @UsePipes(new ValidationPipe(), new CheckPasswordPipe())
  async register(
    @Body() userDto: UserRegisterDto,
  ): Promise<Omit<UserInterface, 'pwdHash'>> {
    return this.usersService.register(userDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('markDepart')
  async markDepart(
    @Body('userId') userId: string,
    @Body('placeId') placeId: string,
  ) {
    await this.usersService.markDepart(userId, Number(placeId));
    return {
      message: 'departure place marked',
    };
  }
}
