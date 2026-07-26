import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanCycle {
  TRIAL = 'TRIAL',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY', // 3 Bulan
  SEMI_ANNUALLY = 'SEMI_ANNUALLY', // 6 Bulan
  YEARLY = 'YEARLY', // 12 Bulan
  CUSTOM = 'CUSTOM', // Fleksibel
}

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value) || 0,
};

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Contoh: "Pro 3 Bulan (Hemat 15%)"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  price: number;

  @Column({ type: 'enum', enum: PlanCycle, default: PlanCycle.MONTHLY })
  cycle: PlanCycle;

  @Column({ type: 'integer', default: 1 })
  monthsCount: number; // Jumlah bulan (misal: 1, 3, 6, 12)

  @Column({ type: 'integer', default: 30 })
  durationDays: number; // Fallback hari jika cycle = DAILY / CUSTOM

  // Flexible Features Limiter
  @Column({ type: 'jsonb', nullable: true })
  features: {
    maxOutlets?: number;
    maxStaff?: number;
    canUseHppModule?: boolean;
    canExportReports?: boolean;
    [key: string]: any;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
