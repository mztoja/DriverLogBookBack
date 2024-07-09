import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BorderInterface } from '../types';

@Entity({
  name: 'borders',
})
export class BorderEntity implements BorderInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: string;
  @Column({ type: 'varchar', length: 30 })
  place: string;
  @Column({ type: 'varchar', length: 3 })
  country1: string;
  @Column({ type: 'varchar', length: 3 })
  country2: string;
}
