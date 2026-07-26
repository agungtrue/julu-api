import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Tenant } from '../../tenants/tenants.entity';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethods {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  QRIS = 'QRIS',
  MIDTRANS = 'MIDTRANS',
}

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value) || 0,
};

@Entity('subscription_invoices')
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber: string; // Contoh: INV-JULU-202607-0001

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  subscriptionId: string;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethods,
    default: PaymentMethods.CASH,
  })
  paymentMethod: PaymentMethods;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentUrl: string; // URL pembayaran dari Payment Gateway

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
