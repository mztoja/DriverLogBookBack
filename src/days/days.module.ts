import { forwardRef, Module } from '@nestjs/common';
import { DaysController } from './days.controller';
import { DaysService } from './days.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsModule } from '../logs/logs.module';
import { DayEntity } from './day.entity';
import { ToursModule } from '../tours/tours.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DayEntity]),
    forwardRef(() => LogsModule),
    forwardRef(() => ToursModule),
  ],
  controllers: [DaysController],
  providers: [DaysService],
})
export class DaysModule {}
