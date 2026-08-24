import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class ResetStockDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Array IDs bahan baku tidak boleh kosong' })
  @IsString({ each: true })
  ids: string[];
}
