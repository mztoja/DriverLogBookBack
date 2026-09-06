import { IsNumber } from "class-validator";

export class BorderDeleteDto {
    @IsNumber()
    id: number;
}