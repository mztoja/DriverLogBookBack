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
  @Column({ type: 'int' })
  startLogId: number;
  @Column({ type: 'int' })
  stopLogId: number;
  @Column({ type: 'time' })
  driveTime: string;
  @Column({ type: 'time' })
  workTime: string;
  @Column({ type: 'decimal', precision: 7 })
  distance: number;
  @Column({ type: 'tinyint' })
  daysOnDuty: number;
  @Column({ type: 'tinyint' })
  daysOffDuty: number;
  @Column({ type: 'decimal', precision: 7, scale: 2 })
  totalRefuel: number;
  @Column({ type: 'decimal', precision: 5 })
  fuelStateBefore: number;
  @Column({ type: 'decimal', precision: 5 })
  fuelStateAfter: number;
  @Column({ type: 'decimal', precision: 7, scale: 2 })
  burnedFuelComp: number;
  @Column({ type: 'decimal', precision: 7, scale: 2 })
  burnedFuelReal: number;
  @Column({ type: 'tinyint' })
  numberOfLoads: number;
  @Column({ type: 'decimal', precision: 5 })
  avgWeight: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  expectedSalary: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  salary: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  outgoings: number;
  @Column({ type: 'varchar', length: 3 })
  currency: string;
}
