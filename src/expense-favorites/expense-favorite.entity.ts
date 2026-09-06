import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ExpenseFavoriteInterface } from '../types';

@Entity({ name: 'expense_favorites' })
export class ExpenseFavoriteEntity implements ExpenseFavoriteInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 30, default: '' })
  place: string;

  @Column({ type: 'int', default: 0 })
  placeId: number;

  @Column({ type: 'varchar', length: 3, default: '' })
  country: string;

  @Column({ type: 'varchar', length: 100 })
  itemDescription: string;

  @Column({ type: 'decimal', precision: 9, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'varchar', length: 15, default: '' })
  payment: string;
}
