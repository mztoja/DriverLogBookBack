import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async markDepart(userId: string, placeId: number): Promise<void> {
    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        markedDepart: placeId,
      },
    );
  }
}
