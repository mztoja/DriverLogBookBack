import { FinanceInterface } from '../types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'finances',
})
export class FinanceEntity implements FinanceInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  tourId: number;
  @Column({ type: 'int' })
  logId: number;
  @Column({ type: 'varchar', length: 100 })
  itemDescription: string;
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  quantity: number;
  @Column({ type: 'decimal', precision: 9, scale: 2 })
  amount: number;
  @Column({ type: 'varchar', length: 3 })
  currency: string;
  @Column({ type: 'decimal', precision: 9, scale: 2 })
  foreignAmount: number;
  @Column({ type: 'varchar', length: 3 })
  foreignCurrency: string;
  @Column({ type: 'varchar', length: 10 })
  payment: string;
}
