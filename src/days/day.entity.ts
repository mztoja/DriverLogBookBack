import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DayInterface } from '../types';

@Entity({
  name: 'days',
})
export class DayEntity implements DayInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  tourId: number;
  @Column({ type: 'int' })
  startLogId: number;
  @Column({ type: 'int' })
  stopLogId: number;
  @Column({ type: 'int' })
  distance: number;
  @Column({ type: 'tinyint' })
  status: number;
  @Column({ type: 'tinyint' })
  cardState: number;
  @Column({ type: 'decimal', precision: 7, scale: 2 })
  fuelBurned: number;
  @Column({ type: 'time' })
  driveTime: string;
  @Column({ type: 'time' })
  driveTime2: string;
  @Column({ type: 'time' })
  workTime: string;
  @Column({ type: 'time' })
  breakTime: string;
  @Column({ type: 'boolean', default: false })
  doubleCrew: boolean;
}
