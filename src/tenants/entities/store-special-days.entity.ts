import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Tenant } from '../tenants.entity';
import { User } from '../../users/users.entity';

@Entity('store_special_days')
@Unique(['tenantId', 'date'])
export class StoreSpecialDays {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'boolean' })
  isOpen: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: true })
  updatedBy: User;
}
