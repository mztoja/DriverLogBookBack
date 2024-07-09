import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceInterface, serviceTypeEnum } from '../types';

@Entity({
  name: 'services',
})
export class ServiceEntity implements ServiceInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  logId: number;
  @Column({ type: 'tinyint' })
  type: serviceTypeEnum;
  @Column({ type: 'int' })
  vehicleId: number;
  @Column({ type: 'varchar', length: 200 })
  entry: string;
}
