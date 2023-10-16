import { Controller, Inject } from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Inject(JwtService)
  private jwtService: JwtService;
}
