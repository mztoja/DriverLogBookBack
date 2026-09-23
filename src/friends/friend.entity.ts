import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FriendInterface, friendStatusEnum } from '../types';

@Entity({ name: 'friends' })
export class FriendEntity implements FriendInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 36 })
  requesterId: string;

  @Column({ type: 'varchar', length: 36 })
  addresseeId: string;

  @Column({ type: 'tinyint', default: friendStatusEnum.pending })
  status: friendStatusEnum;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  respondedAt: string | null;
}
