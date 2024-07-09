import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentInterface } from '../types';

@Entity({
  name: 'payments',
})
export class PaymentEntity implements PaymentInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'varchar', length: 10 })
  method: string;
  @Column({ type: 'boolean', default: false })
  default: boolean;
}
