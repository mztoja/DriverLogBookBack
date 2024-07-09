import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { config } from './config/config';
import { PlacesModule } from './places/places.module';
import { LogsModule } from './logs/logs.module';
import { ToursModule } from './tours/tours.module';
import { AuthModule } from './auth/auth.module';
import { DaysModule } from './days/days.module';
import { BordersModule } from './borders/borders.module';
import { LoadsModule } from './loads/loads.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PaymentsModule } from './payments/payments.module';
import { FinancesModule } from './finances/finances.module';
import { ServicesModule } from './services/services.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: config.dbHost,
      port: 3306,
      username: config.dbUser,
      password: config.dbPassword,
      database: config.dbDatabase,
      entities: ['dist/**/**.entity{.ts,.js}'],
      bigNumberStrings: false,
      logging: false,
      synchronize: true,
    }),
    UsersModule,
    PlacesModule,
    LogsModule,
    ToursModule,
    AuthModule,
    DaysModule,
    BordersModule,
    LoadsModule,
    VehiclesModule,
    PaymentsModule,
    FinancesModule,
    ServicesModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
