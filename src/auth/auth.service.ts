import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthLoginDto } from './dto/auth-login.dto';
import { hashPwd } from '../utlis/hash-pwd';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from './jwt.strategy';
import { config } from '../config/config';
import { sign } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { UserInterface } from '../types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  private createToken(currentTokenId: string): {
    accessToken: string;
    expiresIn: number;
  } {
    const payload: JwtPayload = { id: currentTokenId };
    const expiresIn = config.tokenExpirationTime;
    const accessToken = sign(payload, config.secretJwt, { expiresIn });
    return {
      accessToken,
      expiresIn,
    };
  }

  private async generateToken(user: UserInterface): Promise<string> {
    let token;
    let userWithThisToken = null;
    do {
      token = uuid();
      userWithThisToken = await this.usersRepository.findOne({
        where: { currentTokenId: token },
      });
    } while (!!userWithThisToken);
    await this.usersRepository.update(
      {
        id: user.id,
      },
      {
        currentTokenId: token,
      },
    );
    return token;
  }

  async login(loginDto: AuthLoginDto, res: Response): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email: loginDto.email, pwdHash: hashPwd(loginDto.password) },
      });
      delete user.pwdHash;

      const token = this.createToken(await this.generateToken(user));

      return res
        .cookie('jwt', token.accessToken, {
          secure: false, // if you use https then change it to TRUE !!!!
          domain: 'localhost',
          httpOnly: true,
        })
        .json(user);
    } catch {
      throw new UnauthorizedException('invalidLoginData');
    }
  }

  async logout(user: UserEntity, res: Response) {
    try {
      await this.usersRepository.findOne({
        where: { id: user.id, currentTokenId: null },
      });
      return res
        .clearCookie('jwt', {
          secure: false, // if you use https then change it to TRUE !!!!
          domain: 'localhost',
          httpOnly: true,
        })
        .json({ message: 'logged out' });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
