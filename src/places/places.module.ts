import { forwardRef, Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacesEntity } from './places.entity';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../config/config';
import { AuthenticationModule } from '../authentication/authentication.module';

@Module({
  imports: [
    forwardRef(() => AuthenticationModule),
    TypeOrmModule.forFeature([PlacesEntity]),
    UsersModule,
    JwtModule.register({
      secret: config.secretJwt,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [PlacesService],
  controllers: [PlacesController],
  exports: [PlacesService],
})
export class PlacesModule {}
