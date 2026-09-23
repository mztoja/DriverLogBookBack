import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import { AuthLoginDto } from './dto/auth-login.dto';
import { hashPwd } from '../utlis/hash-pwd';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from './jwt.strategy';
import { config } from '../config/config';
import { sign, verify } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { UserInterface, userLangEnum } from '../types';
import { MailService } from '../mail/mail.service';
import { passwordResetCodeEmailTemplate } from '../templates/email/passwordResetCode';

const baseCookieOptions: CookieOptions = {
  secure: config.secure,
  domain: config.domain,
  httpOnly: config.httpOnly,
  sameSite: config.cookieSameSite,
  path: '/',
};

const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: config.tokenExpirationTime * 1000,
};

const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: config.refreshTokenExpirationTime * 1000,
};

// clearCookie musi dostać te same opcje (bez maxAge) co przy ustawianiu,
// inaczej przeglądarka nie usunie cookie.
const clearCookieOptions: CookieOptions = { ...baseCookieOptions };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private mailService: MailService,
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

  private createRefreshToken(refreshTokenId: string): string {
    const payload: JwtPayload = { id: refreshTokenId };
    return sign(payload, config.secretRefresh, {
      expiresIn: config.refreshTokenExpirationTime,
    });
  }

  private async generateToken(user: UserInterface): Promise<string> {
    let token;
    let userWithThisToken = null;
    do {
      token = uuid();
      userWithThisToken = await this.userRepository.findOne({
        where: { currentTokenId: token },
      });
    } while (!!userWithThisToken);
    await this.userRepository.update(
      {
        id: user.id,
      },
      {
        currentTokenId: token,
      },
    );
    return token;
  }

  // Zwraca losowy id zapisany w `user.refreshToken` (payload `id` refresh-JWT-a).
  private async generateRefreshTokenId(user: UserInterface): Promise<string> {
    let id: string;
    let userWithThisId = null;
    do {
      id = uuid();
      userWithThisId = await this.userRepository.findOne({
        where: [{ currentTokenId: id }, { refreshToken: id }],
      });
    } while (!!userWithThisId);
    await this.userRepository.update({ id: user.id }, { refreshToken: id });
    return id;
  }

  private stripSensitive(user: UserEntity): void {
    delete user.pwdHash;
    delete user.refreshToken;
  }

  async login(loginDto: AuthLoginDto, res: Response, req: Request): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email, pwdHash: hashPwd(loginDto.password) },
      });
      if (!user) throw new UnauthorizedException('INVALID_LOGIN_DATA');

      const token = this.createToken(await this.generateToken(user));
      const refreshTokenJwt = this.createRefreshToken(
        await this.generateRefreshTokenId(user),
      );
      this.stripSensitive(user);

      const isMobileApp = req.headers['is-mobile-app'];
      if (isMobileApp) {
        return res.status(200).json({
          user,
          accessToken: token.accessToken,
          refreshToken: refreshTokenJwt,
        });
      }
      return res
        .cookie('jwt', token.accessToken, accessCookieOptions)
        .cookie(config.refreshCookieName, refreshTokenJwt, refreshCookieOptions)
        .json(user);
    } catch {
      throw new UnauthorizedException('invalidLoginData');
    }
  }

  async refresh(req: Request, res: Response): Promise<any> {
    const fromCookie = req.cookies?.[config.refreshCookieName];
    const fromHeader = req.headers['x-refresh-token'] as string | undefined;
    const token = fromCookie || fromHeader;
    const isMobileApp =
      !!req.headers['is-mobile-app'] || (!fromCookie && !!fromHeader);

    if (!token) {
      return this.rejectRefresh(res);
    }

    let payload: JwtPayload;
    try {
      payload = verify(token, config.secretRefresh) as JwtPayload;
    } catch {
      return this.rejectRefresh(res);
    }
    if (!payload || !payload.id) {
      return this.rejectRefresh(res);
    }

    const user = await this.userRepository.findOne({
      where: { refreshToken: payload.id },
    });
    if (!user) {
      return this.rejectRefresh(res);
    }

    try {
      const accessTokenData = this.createToken(await this.generateToken(user));
      const refreshTokenJwt = this.createRefreshToken(
        await this.generateRefreshTokenId(user),
      );
      this.stripSensitive(user);

      if (isMobileApp) {
        return res.status(200).json({
          user,
          accessToken: accessTokenData.accessToken,
          refreshToken: refreshTokenJwt,
        });
      }
      return res
        .cookie('jwt', accessTokenData.accessToken, accessCookieOptions)
        .cookie(config.refreshCookieName, refreshTokenJwt, refreshCookieOptions)
        .json(user);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  // Jawny res.status(401).json(...) zamiast throw – po dotknięciu `res`
  // rzucenie wyjątku grozi „headers already sent”. Kształt {status,dtc}
  // zgodny z GlobalExceptionFilter, więc front obsłuży to jak zwykłe 401.
  private rejectRefresh(res: Response) {
    res
      .clearCookie('jwt', clearCookieOptions)
      .clearCookie(config.refreshCookieName, clearCookieOptions);
    return res.status(401).json({ status: 401, dtc: 'Unauthorized' });
  }

  async logout(user: UserEntity, res: Response) {
    try {
      await this.userRepository.update(
        { id: user.id },
        {
          currentTokenId: null,
          refreshToken: null,
        },
      );
      return res
        .clearCookie('jwt', clearCookieOptions)
        .clearCookie(config.refreshCookieName, clearCookieOptions)
        .json({ message: 'logged out' });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  // "Zapomniałem hasła": unieważnia bieżącą sesję (currentTokenId/refreshToken), zapisuje
  // 6-cyfrowy kod W MIEJSCU currentTokenId (jednorazowy, krótkotrwały "token" resetu — dopóki
  // ktoś nie zaloguje się/zresetuje hasła, i tak nic nim nie zweryfikuje jako JWT) i wysyła go
  // mailem. Milczy, gdy e-mail nie istnieje — nie zdradzamy, czy dane konto jest zarejestrowane.
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return;
    }
    const code = this.generateResetCode();
    await this.userRepository.update({ id: user.id }, { currentTokenId: code, refreshToken: null });
    await this.trySendMail(
      user.email,
      user.lang === userLangEnum.pl ? 'Kod do zresetowania hasła' : 'Password reset code',
      passwordResetCodeEmailTemplate(user.lang, code),
    );
  }

  // Tylko sprawdza kod — bez efektów ubocznych. Front woła to zanim pokaże pole nowego hasła;
  // faktyczna zmiana hasła (resetPassword) i tak weryfikuje kod jeszcze raz na własną rękę.
  async verifyResetCode(email: string, code: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email, currentTokenId: code } });
    if (!user) {
      throw new BadRequestException('invalidResetCode');
    }
  }

  async resetPassword(email: string, code: string, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email, currentTokenId: code } });
    if (!user) {
      throw new BadRequestException('invalidResetCode');
    }
    await this.userRepository.update({ id: user.id }, { pwdHash: hashPwd(password), currentTokenId: null });
  }

  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Powiadomienie mailowe jest efektem ubocznym, nie warunkiem powodzenia — błąd SMTP nie może
  // uniemożliwić samego zainicjowania resetu (patrz analogiczne zabezpieczenie w UsersService).
  private async trySendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailService.sendMail(to, subject, html);
    } catch (mailError) {
      console.error('Failed to send password reset email', mailError);
    }
  }
}
