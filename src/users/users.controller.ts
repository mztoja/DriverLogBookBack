import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserInterface } from '../types';
import { CheckPasswordPipe } from '../pipes/check-password.pipe';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from './user.entity';
import { UserMarkDepartDto } from './dto/user-mark-depart.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  @UsePipes(new ValidationPipe(), new CheckPasswordPipe())
  async register(
    @Body() userDto: UserRegisterDto,
  ): Promise<Omit<UserInterface, 'pwdHash'>> {
    const checkUser = await this.usersService.find(userDto.email);
    if (checkUser) {
      throw new BadRequestException('email exist');
    }
    return await this.usersService.register(userDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('markDepart')
  async markDepart(
    @Body() body: UserMarkDepartDto,
    @UserObj() user: UserEntity,
  ) {
    return await this.usersService.markDepart(user.id, body.placeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('userUpdate')
  async userUpdate(
    @UserObj() user: UserEntity,
    @Body() body: UserUpdateDto,
  ): Promise<UserEntity> {
    return await this.usersService.update(user.id, body);
  }
}
