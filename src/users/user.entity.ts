import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserInterface } from '../types/userInterface';

@Entity({
  name: 'v2_users',
})
export class UserEntity implements UserInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: number;

  @Column({ default: 'en' })
  lang: 'pl' | 'en';

  @Column({ name: 'register_date', default: () => 'CURRENT_TIMESTAMP' })
  registerDate: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  company: number;

  @Column()
  customer: string;

  @Column({ name: 'bid_type' })
  bidType: number;

  @Column()
  bid: number;

  @Column()
  cur: string;

  @Column()
  marked: number;

  @Column()
  marked2: number;

  @Column({ name: 'fuel_con_type' })
  fuelConType: number;

  @Column({ name: 'fuel_con_disp' })
  fuelConDisp: number;

  @Column()
  country: string;

  @Column()
  gen: string;
}
