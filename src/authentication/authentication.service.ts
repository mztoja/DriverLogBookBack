import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { Repository } from 'typeorm';
import { PlacesService } from '../places/places.service';
import { UserCreateDto } from './dto/user.create.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(PlacesService)
    private placesService: PlacesService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: UserCreateDto): Promise<UserEntity> {
    return this.usersRepository.save(data);
  }

  async findOne(condition: any): Promise<UserEntity> {
    return this.usersRepository.findOne(condition);
  }
}
