import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserNoteInterface } from '../types';

@Entity({ name: 'user_notes' })
export class UserNoteEntity implements UserNoteInterface {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string;
}
