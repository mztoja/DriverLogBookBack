import { IsEmail } from 'class-validator';

export class AuthForgotPasswordDto {
  @IsEmail({}, { message: 'email' })
  email: string;
}
