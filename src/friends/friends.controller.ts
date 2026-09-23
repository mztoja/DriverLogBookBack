import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { FriendInviteDto } from './dto/friend-invite.dto';
import { FriendRespondDto } from './dto/friend-respond.dto';
import { FriendEntity } from './friend.entity';
import { FriendsListInterface } from '../types';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('get')
  async get(@UserObj() user: UserEntity): Promise<FriendsListInterface> {
    return await this.friendsService.getFriendsData(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  async invite(@UserObj() user: UserEntity, @Body() body: FriendInviteDto): Promise<FriendEntity> {
    return await this.friendsService.invite(user, body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept')
  async accept(@UserObj() user: UserEntity, @Body() body: FriendRespondDto): Promise<void> {
    return await this.friendsService.accept(user, body.id);
  }

  // Odrzucenie przychodzącego zaproszenia, anulowanie wysłanego zaproszenia i usunięcie
  // zaakceptowanego znajomego to ta sama operacja — patrz komentarz przy FriendsService.remove.
  @UseGuards(JwtAuthGuard)
  @Post('decline')
  async decline(@UserObj() user: UserEntity, @Body() body: FriendRespondDto): Promise<void> {
    return await this.friendsService.remove(user, body.id);
  }
}
