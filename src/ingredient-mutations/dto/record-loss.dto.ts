import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class RecordLossDto {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsString()
  @IsOptional()
  referenceId: string;
}
