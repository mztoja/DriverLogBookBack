import { Body, Controller, Inject, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Inject(JwtService)
  private jwtService: JwtService;

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
