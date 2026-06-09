import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsBoolean,
  IsOptional, IsEmail,
  MinLength
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
    email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
    phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @IsString()
    password: string;

  @ApiProperty({ default: true })
  @IsNotEmpty()
  @IsBoolean()
    is_active?: boolean = true;
}
