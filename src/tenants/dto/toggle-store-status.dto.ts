import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ToggleStoreStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
