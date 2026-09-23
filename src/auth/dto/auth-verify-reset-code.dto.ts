import { IsEmail, Matches } from 'class-validator';

export class AuthVerifyResetCodeDto {
  @IsEmail({}, { message: 'email' })
  email: string;
  @Matches(/^\d{6}$/, { message: 'invalidResetCode' })
  code: string;
}
