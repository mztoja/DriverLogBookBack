import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthLoginDto {
  @IsEmail({}, { message: 'email' })
  email: string;
  @IsNotEmpty({ message: 'password' })
  password: string;
}
