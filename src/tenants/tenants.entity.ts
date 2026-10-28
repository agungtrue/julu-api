import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionInvoice } from '../subscriptions/entities/subscription-invoice.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  subdomain: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'int4', default: 0 })
  daily_opex: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: 'Terima kasih atas kunjungan Anda!',
  })
  receiptFooter: string;

  @Column({
    type: 'int',
    array: true,
    default: [1, 2, 3, 4, 5, 6, 0],
  })
  operating_days: number[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => User, (user) => user.tenant, { cascade: true })
  user: User;

  @OneToMany(() => Subscription, (sub) => sub.tenant)
  subscriptions: Subscription[];

  @OneToMany(() => SubscriptionInvoice, (sub) => sub.tenant)
  subscriptionInvoices: SubscriptionInvoice[];
}
