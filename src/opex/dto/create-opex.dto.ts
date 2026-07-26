import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { OpexCategory, OpexType } from '../opex.entity'; // Sesuaikan path ini

export class CreateOpexDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul pengeluaran wajib diisi.' })
  @MaxLength(150, { message: 'Judul pengeluaran maksimal 150 karakter.' })
  title: string;

  @IsEnum(OpexCategory, {
    message:
      'Kategori harus berupa: UTILITIES, SALARY, RENT, MAINTENANCE, SUPPLIES, MARKETING, atau OTHERS',
  })
  @IsNotEmpty({ message: 'Kategori pengeluaran wajib dipilih.' })
  category: OpexCategory;

  @IsEnum(OpexType, {
    message: 'Tipe pengeluaran harus berupa FIXED atau ONE_TIME',
  })
  @IsNotEmpty({
    message: 'Tipe pengeluaran (Harian/Dadakan) wajib ditentukan.',
  })
  type: OpexType;

  @IsNumber({}, { message: 'Nominal pengeluaran harus berupa angka.' })
  @IsNotEmpty({ message: 'Nominal pengeluaran wajib diisi.' })
  @Min(0, { message: 'Nominal pengeluaran tidak boleh minus.' })
  amount: number;

  @IsDateString(
    {},
    {
      message:
        'Format tanggal expense_date salah (Gunakan format ISO, contoh: YYYY-MM-DD)',
    },
  )
  @IsOptional()
  expense_date?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean({ message: 'Status aktif harus berupa boolean (true/false).' })
  @IsOptional()
  isActive?: boolean;
}
