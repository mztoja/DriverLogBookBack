import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LogInterface } from '../types';

@Entity({
  name: 'logs',
})
export class LogEntity implements LogInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  tourId: number;
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  date: string;
  @Column({ type: 'varchar', length: 100 })
  action: string;
  @Column({ type: 'varchar', length: 3 })
  country: string;
  @Column({ type: 'varchar', nullable: true, length: 30 })
  place: string;
  @Column({ type: 'int' })
  placeId: number;
  @Column({ type: 'int' })
  odometer: number;
  @Column({ type: 'text', nullable: true, default: null })
  notes: string;
  @Column({ type: 'tinyint' })
  type: number;
}
