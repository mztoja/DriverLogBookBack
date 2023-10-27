import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './user.entity';
import { PlacesModule } from '../places/places.module';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => PlacesModule),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [UsersService, JwtStrategy],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
