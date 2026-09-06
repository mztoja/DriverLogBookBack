import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LoadInterface } from '../types';
import { loadStatusEnum } from '../types';

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
  @Column({ type: 'int', default: '0' })
  unloadingLogId: number;
  @Column({ type: 'int', default: '0' })
  senderId: number;
  @Column({ type: 'int', default: '0' })
  receiverId: number;
  @Column({ type: 'varchar', length: 10, default: '' })
  vehicle: string;
  @Column({ type: 'varchar', length: 30, default: '' })
  description: string;
  @Column({ type: 'varchar', length: 30, default: '' })
  quantity: string;
  @Column({ type: 'varchar', length: 20, default: '' })
  reference: string;
  @Column({ type: 'int' })
  weight: number;
  @Column({ type: 'int', default: '0' })
  distance: number;
}
