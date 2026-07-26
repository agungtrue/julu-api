import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsNotIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RESERVED_SUBDOMAINS } from 'src/common/constants/reserved-subdomains.constant';

// Enum untuk standardisasi jenis paket langganan Julu POS
export enum Status {
  ACTIVE = 'ACTIVE',
  SUSPEND = 'SUSPEND',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Julu Coffee & Snacks' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'julu-coffee' })
  @IsString()
  @IsNotEmpty({ message: 'Subdomain wajib diisi' })
  @MinLength(3, { message: 'Subdomain minimal 3 karakter' })
  @MaxLength(30, { message: 'Subdomain maksimal 30 karakter' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Subdomain hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)',
  })
  @IsNotIn(RESERVED_SUBDOMAINS, {
    message: 'Subdomain ini dilindungi oleh sistem dan tidak dapat digunakan.',
  })
  subdomain: string;

  @ApiProperty({ example: 85000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  daily_opex?: number;
}

export class UpdateTenantDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 90000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  daily_opex?: number;
}
