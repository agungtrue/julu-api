import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';
import { PlanCycle } from '../entities/subscription-plan.entity';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(PlanCycle)
  cycle: PlanCycle;

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}