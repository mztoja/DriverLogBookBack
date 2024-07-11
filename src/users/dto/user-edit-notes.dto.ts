import { IsString } from 'class-validator';

export class UserEditNotesDto {
    @IsString()
    notes: string;
}