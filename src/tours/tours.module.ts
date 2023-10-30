import { forwardRef, Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourEntity } from './tour.entity';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TourEntity]),
    forwardRef(() => LogsModule),
  ],
  providers: [ToursService],
  controllers: [ToursController],
  exports: [ToursService],
})
export class ToursModule {}
