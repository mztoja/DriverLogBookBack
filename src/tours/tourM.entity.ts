import { TourMInterface } from '../types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'tours_m',
})
export class TourMEntity implements TourMInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'json' })
  toursId: number[];
  @Column({ type: 'date' })
  month: string;
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
