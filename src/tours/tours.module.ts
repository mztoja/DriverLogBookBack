import { forwardRef, Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourEntity } from './tour.entity';
import { LogsModule } from '../logs/logs.module';
import { DaysModule } from '../days/days.module';
import { FinancesModule } from '../finances/finances.module';
import { LoadsModule } from '../loads/loads.module';
import { TourMEntity } from './tourM.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TourEntity]),
    TypeOrmModule.forFeature([TourMEntity]),
    forwardRef(() => LogsModule),
    forwardRef(() => DaysModule),
    forwardRef(() => FinancesModule),
    forwardRef(() => LoadsModule),
  ],
  providers: [ToursService],
  controllers: [ToursController],
  exports: [ToursService],
})
export class ToursModule {}
