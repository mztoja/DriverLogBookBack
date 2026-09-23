import { IsEmail } from 'class-validator';

export class FriendInviteDto {
  @IsEmail({}, { message: 'friendEmailInvalid' })
  email: string;
}
