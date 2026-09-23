import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendEntity } from './friend.entity';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';
import { ToursModule } from '../tours/tours.module';
import { LoadsModule } from '../loads/loads.module';
import { PlacesModule } from '../places/places.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendEntity]),
    forwardRef(() => UsersModule),
    forwardRef(() => LogsModule),
    forwardRef(() => ToursModule),
    forwardRef(() => LoadsModule),
    forwardRef(() => PlacesModule),
    forwardRef(() => MailModule),
  ],
  providers: [FriendsService],
  controllers: [FriendsController],
  exports: [FriendsService],
})
export class FriendsModule {}
