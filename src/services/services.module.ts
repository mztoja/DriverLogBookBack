import { forwardRef, Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from './service.entity';
import { LogsModule } from '../logs/logs.module';
import { ToursModule } from '../tours/tours.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceEntity]),
    forwardRef(() => LogsModule),
    forwardRef(() => ToursModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
