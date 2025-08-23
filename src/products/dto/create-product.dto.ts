import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsBoolean
} from 'class-validator';
import { ProductType } from '../enums/product.enum'
import { SizeType } from '../enums/size.enum'

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    name: string;

  @ApiProperty()
  @IsNotEmpty()
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  type: ProductType;

  @ApiProperty()
  @IsNotEmpty()
  size: SizeType;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActive: true;
}
