import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class StockOpnameDto {
  @IsUUID()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0)
  actualPhysicalStock: number; // Angka riil hasil hitung fisik di wadah/gudang

  @IsOptional()
  @IsString()
  notes?: string;
}
