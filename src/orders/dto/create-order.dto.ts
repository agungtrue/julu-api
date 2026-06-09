import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsBoolean,
  IsOptional,
  IsNumber
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
  @IsNumber()
    // userId: string;
    userId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
    customerId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
    outletId: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
    promoId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    uuid: string;
}
