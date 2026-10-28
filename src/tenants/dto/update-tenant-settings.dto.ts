import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
  Max,
  ArrayUnique,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  operating_days?: number[];
}
