import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { PlaceInterface } from '../types';

@Entity({
  name: 'places',
})
export class PlacesEntity implements PlaceInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'tinyint', default: 0 })
  type: number;

  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  street: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 30 })
  city: string;

  @Column({ type: 'varchar', length: 3 })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, default: 0 })
  lat: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, default: 0 })
  lon: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string;
}
