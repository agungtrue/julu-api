import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Password saat ini wajib diisi.' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi.' })
  @MinLength(8, { message: 'Password baru minimal 8 karakter.' })
  newPassword: string;
}
