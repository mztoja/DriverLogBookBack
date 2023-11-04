import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LoadInterface } from '../types';
import { loadStatusEnum } from '../types/load/LoadEnums';

@Entity({
  name: 'loads',
})
export class LoadEntity implements LoadInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'varchar', length: 36 })
  userId: string;
  @Column({ type: 'int' })
  tourId: number;
  @Column({ type: 'tinyint' })
  status: loadStatusEnum;
  @Column({ type: 'int' })
  loadNr: number;
  @Column({ type: 'int' })
  loadingLogId: number;
  @Column({ type: 'int' })
  unloadingLogId: number;
  @Column({ type: 'int' })
  senderId: number;
  @Column({ type: 'int' })
  receiverId: number;
  @Column({ type: 'varchar', length: 10 })
  vehicle: string;
  @Column({ type: 'varchar', length: 30 })
  description: string;
  @Column({ type: 'varchar', length: 30 })
  quantity: string;
  @Column({ type: 'varchar', length: 20 })
  reference: string;
  @Column({ type: 'int' })
  weight: number;
  @Column({ type: 'int' })
  distance: number;
}
