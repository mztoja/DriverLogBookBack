import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNoteEntity } from './user-note.entity';

@Injectable()
export class UserNotesService {
  private readonly KEEP = 5;

  constructor(
    @InjectRepository(UserNoteEntity)
    private userNoteRepository: Repository<UserNoteEntity>,
  ) {}

  async getHistory(userId: string): Promise<UserNoteEntity[]> {
    return await this.userNoteRepository.find({
      where: { userId },
      order: { id: 'DESC' },
      take: this.KEEP,
    });
  }

  async save(userId: string, notes: string): Promise<UserNoteEntity[]> {
    await this.userNoteRepository.save({ userId, notes });
    // po zapisie zostaw tylko 5 najnowszych – skasuj najstarsze
    const all = await this.userNoteRepository.find({
      where: { userId },
      order: { id: 'DESC' },
      select: ['id'],
    });
    const stale = all.slice(this.KEEP);
    if (stale.length) {
      await this.userNoteRepository.delete(stale.map((n) => n.id));
    }
    return await this.getHistory(userId);
  }
}
