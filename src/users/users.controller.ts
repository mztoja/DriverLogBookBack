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
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from './user.entity';
import { MarkDepartDto } from './dto/mark.depart.dto';

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
  async markDepart(@Body() body: MarkDepartDto, @UserObj() user: UserEntity) {
    console.log(body);
    return await this.usersService.markDepart(user.id, body.placeId);
  }
}
