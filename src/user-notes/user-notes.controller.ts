import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserNotesService } from './user-notes.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { UserNoteEntity } from './user-note.entity';
import { SaveUserNoteDto } from './dto/save-user-note.dto';

@Controller('user-notes')
export class UserNotesController {
  constructor(private readonly userNotesService: UserNotesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getHistory(@UserObj() user: UserEntity): Promise<UserNoteEntity[]> {
    return await this.userNotesService.getHistory(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async save(
    @UserObj() user: UserEntity,
    @Body() data: SaveUserNoteDto,
  ): Promise<UserNoteEntity[]> {
    return await this.userNotesService.save(user.id, data.notes);
  }
}
