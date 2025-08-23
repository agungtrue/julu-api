import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsBoolean,
  IsOptional, IsEmail
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    first_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    last_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
    email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    phone: string;

  @ApiProperty({ default: true })
  @IsNotEmpty()
  @IsBoolean()
    is_active?: boolean = true;
}
