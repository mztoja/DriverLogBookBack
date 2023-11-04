import { forwardRef, Module } from '@nestjs/common';
import { LoadsService } from './loads.service';
import { LoadsController } from './loads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoadEntity } from './load.entity';
import { LogsModule } from '../logs/logs.module';
import { ToursModule } from '../tours/tours.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoadEntity]),
    forwardRef(() => LogsModule),
    forwardRef(() => ToursModule),
  ],
  providers: [LoadsService],
  controllers: [LoadsController],
})
export class LoadsModule {}
