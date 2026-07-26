import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethods } from '../entities/subscription-invoice.entity';

export class CheckoutInvoiceDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsEnum(PaymentMethods)
  paymentMethod?: PaymentMethods;
}
