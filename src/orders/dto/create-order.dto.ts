import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  payment_method: string;

  @ApiProperty({ required: true })
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  outletId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  promoId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  uuid: string;
}
