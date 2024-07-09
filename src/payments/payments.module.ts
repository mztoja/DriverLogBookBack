import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './payment.entity';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity])],
  providers: [PaymentsService],
  exports: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
