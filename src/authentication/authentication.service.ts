import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { Repository } from 'typeorm';
import { PlacesService } from '../places/places.service';
import { UserCreateDto } from './dto/user.create.dto';
import { UserInterface } from '../types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(PlacesService)
    private placesService: PlacesService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @Inject(JwtService)
    private jwtService: JwtService,
  ) {}

  async create(data: UserCreateDto): Promise<UserEntity> {
    return this.usersRepository.save(data);
  }

  async findOne(condition: any): Promise<UserEntity> {
    return this.usersRepository.findOne(condition);
  }

  async findByCookie(cookie: string): Promise<Omit<UserInterface, 'password'>> {
    const data = await this.jwtService.verifyAsync(cookie);
    if (!data) {
      throw new UnauthorizedException();
    }
    const user = await this.findOne({
      where: { id: data['id'] },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
