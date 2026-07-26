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
import { Tenant } from '../tenants/tenants.entity';
import { User } from '../users/users.entity';

// 🟢 1. Definisikan Enum OPEX khusus FnB
export enum OpexCategory {
  UTILITIES = 'UTILITIES',
  SALARY = 'SALARY',
  RENT = 'RENT',
  MAINTENANCE = 'MAINTENANCE',
  SUPPLIES = 'SUPPLIES',
  MARKETING = 'MARKETING',
  OTHERS = 'OTHERS',
}

export enum OpexType {
  FIXED = 'FIXED',
  ONE_TIME = 'ONE_TIME',
}

@Entity('opex')
@Index(['tenantId'])
@Index(['tenantId', 'expense_date'])
export class Opex {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({
    type: 'enum',
    enum: OpexCategory,
    default: OpexCategory.OTHERS,
  })
  category: OpexCategory;

  @Column({ type: 'integer', default: 0 })
  amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  expense_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @Column({
    type: 'enum',
    enum: OpexType,
    default: OpexType.ONE_TIME,
  })
  type: OpexType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
