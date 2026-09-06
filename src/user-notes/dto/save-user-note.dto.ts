import { IsString } from 'class-validator';

export class SaveUserNoteDto {
  @IsString()
  notes: string;
}
