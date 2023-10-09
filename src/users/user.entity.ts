import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserInterface, UserLangEnum } from '../types';

@Entity({
  name: 'users',
})
export class UserEntity implements UserInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'tinyint' })
  status: number;

  @Column({ type: 'tinyint', default: 0 })
  lang: UserLangEnum;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  registerAt: string;

  @Column({ unique: true, type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'varchar', length: 60 })
  password: string;

  @Column({ type: 'varchar', length: 22, nullable: true, default: null })
  firstName: string;

  @Column({ type: 'varchar', length: 22, nullable: true, default: null })
  lastName: string;

  @Column({ type: 'int', precision: 11 })
  companyId: number;

  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  customer: string;

  @Column({ type: 'tinyint', default: 0 })
  bidType: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  bid: number;

  @Column({ type: 'tinytext', nullable: true, default: null })
  currency: string;

  @Column({ type: 'int', precision: 11, default: 0 })
  markedArrive: number;

  @Column({ type: 'int', precision: 11, default: 0 })
  markedDepart: number;

  @Column({ type: 'tinyint', default: 1 })
  fuelConType: number;

  @Column({ type: 'tinyint', default: 1 })
  fuelConDisp: number;

  @Column({ type: 'tinytext', nullable: true, default: null })
  country: string;

  @Column({ type: 'tinyint', nullable: true, default: null })
  gen: string;
}
