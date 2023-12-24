import { forwardRef, Module } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceEntity } from './finance.entity';
import { LogsModule } from '../logs/logs.module';
import { ToursModule } from '../tours/tours.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinanceEntity]),
    forwardRef(() => LogsModule),
    forwardRef(() => ToursModule),
  ],
  providers: [FinancesService],
  controllers: [FinancesController],
})
export class FinancesModule {}
