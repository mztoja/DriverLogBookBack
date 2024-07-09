import { IsNumber } from "class-validator";

export class tourDeleteSettlementDto {
    @IsNumber()
    id: number;
}