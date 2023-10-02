import { Controller, Get } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/')
  getUsers(): Promise<UserEntity[]> | null {
    return this.usersService.findAll();
  }
}
