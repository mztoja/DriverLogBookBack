import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserNoteEntity } from './user-note.entity';
import { UserNotesService } from './user-notes.service';
import { UserNotesController } from './user-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserNoteEntity])],
  providers: [UserNotesService],
  exports: [UserNotesService],
  controllers: [UserNotesController],
})
export class UserNotesModule {}
