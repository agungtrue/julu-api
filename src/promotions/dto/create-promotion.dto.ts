import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsBoolean
} from 'class-validator';
import { PromotionType } from '../enums/promotion.enum'

export class CreatePromotionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  value: number;

  @ApiProperty()
  @IsNotEmpty()
  type: PromotionType;

  @ApiProperty()
  @IsNotEmpty()
  quota: number;

  @ApiProperty()
  @IsNotEmpty()
  maxItem: number;

  @ApiProperty()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActive: true;
}
