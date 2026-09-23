import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class AuthResetPasswordDto {
  @IsEmail({}, { message: 'email' })
  email: string;
  @Matches(/^\d{6}$/, { message: 'invalidResetCode' })
  code: string;
  @IsNotEmpty({ message: 'password' })
  password: string;
}
