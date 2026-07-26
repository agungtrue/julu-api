import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/tenants.entity'; // Sesuaikan path entitas Tenant Anda
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  TRIALING = 'TRIALING', // Masa uji coba gratis
  ACTIVE = 'ACTIVE', // Berlangganan aktif
  PAST_DUE = 'PAST_DUE', // Masa tenggang (Grace Period)
  EXPIRED = 'EXPIRED', // Kadaluarsa & Fitur dikunci
  CANCELLED = 'CANCELLED', // Dibatalkan oleh admin/owner
}

@Entity('subscriptions')
@Index(['tenantId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date; // Tanggal Kunci Expired

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
