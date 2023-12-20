import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
  ) {}

  async getPaymentsMethods(userId: string): Promise<PaymentEntity[]> {
    return await this.paymentRepository.find({
      where: { userId },
      order: { method: 'ASC' },
    });
  }

  async findByUserAndId(userId: string, id: number): Promise<PaymentEntity> {
    return await this.paymentRepository.findOne({
      where: { userId, id },
    });
  }

  async add(userId: string, method: string): Promise<PaymentEntity[]> {
    await this.paymentRepository.save({
      userId,
      method,
      default: false,
    });
    return await this.getPaymentsMethods(userId);
  }

  async delete(userId: string, id: number): Promise<PaymentEntity[]> {
    const find = await this.findByUserAndId(userId, id);
    await this.paymentRepository.delete({ id: find.id });
    return await this.getPaymentsMethods(userId);
  }

  async select(userId: string, id: number): Promise<PaymentEntity[]> {
    await this.paymentRepository.update({ userId }, { default: false });
    if (id !== 0) {
      const find = await this.findByUserAndId(userId, id);
      await this.paymentRepository.update({ id: find.id }, { default: true });
    }
    return await this.getPaymentsMethods(userId);
  }
}
