import { forwardRef, Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from './log.entity';
import { ToursModule } from '../tours/tours.module';
import { UsersModule } from '../users/users.module';
import { BordersModule } from '../borders/borders.module';
import { LoadsModule } from '../loads/loads.module';
import { DaysModule } from '../days/days.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntity]),
    forwardRef(() => ToursModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BordersModule),
    forwardRef(() => LoadsModule),
    forwardRef(() => DaysModule),
  ],
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService],
})
export class LogsModule {}
