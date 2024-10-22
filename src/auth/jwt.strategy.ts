import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { config } from '../config/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { Repository } from 'typeorm';

export interface JwtPayload {
  id: string;
}

function jwtExtractor(req: any): null | string {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }

  return null;
}

// function cookieExtractor(req: any): null | string {
//   return req && req.cookies ? req.cookies?.jwt ?? null : null;
// }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    super({
      // jwtFromRequest: cookieExtractor,
      jwtFromRequest: jwtExtractor,
      secretOrKey: config.secretJwt,
    });
  }

  async validate(payload: JwtPayload, done: (error, user) => void) {
    if (!payload || !payload.id) {
      return done(new UnauthorizedException(), false);
    }

    const user = await this.userRepository.findOne({
      where: { currentTokenId: payload.id },
    });
    if (!user) {
      return done(new UnauthorizedException(), false);
    }

    done(null, user);
  }
}
