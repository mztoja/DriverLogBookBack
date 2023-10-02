import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: any): Promise<UserEntity> {
    return this.usersRepository.save(data);
  }

  async findOne(condition: any): Promise<UserEntity> {
    return this.usersRepository.findOne(condition);
  }
}
