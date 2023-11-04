import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleInterface } from '../types';

@Entity({
  name: 'vehicles',
})
export class VehicleEntity implements VehicleInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  companyId: number;
  @Column({ type: 'tinyint' })
  type: number;
  @Column({ type: 'varchar', length: 30 })
  registrationNr: string;
  @Column({ type: 'boolean' })
  isLoadable: boolean;
  @Column({ type: 'varchar', length: 30 })
  model: string;
  @Column({ type: 'smallint', nullable: true, default: null })
  fuel: number | null;
  @Column({ type: 'smallint' })
  weight: number;
  @Column({ type: 'smallint' })
  year: number;
  @Column({ type: 'int', nullable: true, default: null })
  service: number | null;
  @Column({ type: 'date' })
  insurance: string;
  @Column({ type: 'date' })
  techRev: string;
  @Column({ type: 'date', nullable: true, default: null })
  tacho: string | null;
  @Column({ type: 'text', nullable: true, default: null })
  notes: string;
}
