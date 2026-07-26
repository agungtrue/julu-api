import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class RenewSubscriptionDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  planId: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
