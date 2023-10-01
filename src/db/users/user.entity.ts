import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'v2_users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  status: number;
}
