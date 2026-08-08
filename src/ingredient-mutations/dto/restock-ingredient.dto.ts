import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class RestockIngredientDto {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  cost_per_unit?: number; // Harga beli per unit untuk hitung WAC/HPP baru

  @IsOptional()
  @IsString()
  referenceId?: string; // No Nota / Invoice Supplier

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  purchase_cost?: string;
}
