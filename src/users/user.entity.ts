import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserInterface, UserLangEnum } from '../types';

@Entity({
  name: 'users',
})
export class UserEntity implements UserInterface {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: number;

  @Column({ default: 0 })
  lang: UserLangEnum;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'datetime' })
  registerAt: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column()
  companyId: number;

  @Column()
  customer: string;

  @Column()
  bidType: number;

  @Column()
  bid: number;

  @Column()
  cur: string;

  @Column()
  marked: number;

  @Column()
  marked2: number;

  @Column()
  fuelConType: number;

  @Column()
  fuelConDisp: number;

  @Column()
  country: string;

  @Column()
  gen: string;
}
