import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TourInterface } from '../types';

@Entity({
  name: 'tours',
})
export class TourEntity implements TourInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  tourNr: number;
  @Column({ type: 'tinyint' })
  status: number;
  @Column({ type: 'varchar', length: 10 })
  truck: string;
  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  trailer: string | null;
  @Column({ type: 'int' })
  startLogId: number;
  @Column({ type: 'int', default: '0' })
  stopLogId: number;
  @Column({ type: 'time', default: '0' })
  driveTime: string;
  @Column({ type: 'time', default: '0' })
  workTime: string;
  @Column({ type: 'decimal', precision: 7, default: '0' })
  distance: number;
  @Column({ type: 'tinyint', default: '0' })
  daysOnDuty: number;
  @Column({ type: 'tinyint', default: '0' })
  daysOffDuty: number;
  @Column({ type: 'decimal', precision: 7, scale: 2, default: '0' })
  totalRefuel: number;
  @Column({ type: 'decimal', precision: 5 })
  fuelStateBefore: number;
  @Column({ type: 'decimal', precision: 5, default: '0' })
  fuelStateAfter: number;
  @Column({ type: 'decimal', precision: 7, scale: 2, default: '0' })
  burnedFuelComp: number;
  @Column({ type: 'decimal', precision: 7, scale: 2, default: '0' })
  burnedFuelReal: number;
  @Column({ type: 'tinyint', default: '0' })
  numberOfLoads: number;
  @Column({ type: 'decimal', precision: 5, default: '0' })
  avgWeight: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: '0' })
  expectedSalary: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: '0' })
  salary: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: '0' })
  outgoings: number;
  @Column({ type: 'varchar', length: 3, default: '' })
  currency: string;
}
