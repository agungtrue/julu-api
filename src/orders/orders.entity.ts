import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Customer } from '../customers/customers.entity';
import { User } from '../users/users.entity';
import { Promotion } from '../promotions/promotions.entity';
import { Outlet } from '../outlets/outlets.entity';
import { OrderItem } from '../order_items/order_items.entity';
import { StatusType } from './enums/status.enum';
import { Tenant } from '../tenants/tenants.entity';

@Entity('orders')
@Index(['tenantId'])
@Index(['tenantId', 'id'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Outlet, (outlet) => outlet.order)
  @JoinColumn({ name: 'outletId' })
  outlet: Outlet;

  @Column({ type: 'uuid', nullable: true })
  outletId: string;

  @ManyToOne(() => Promotion, (promo) => promo.orders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'promoId' })
  promo: Promotion;

  @Column({ type: 'uuid', nullable: true })
  promoId: string;

  @Column({ type: 'integer' })
  total: number;

  @Column({ type: 'varchar', length: 30, default: 'cash' })
  payment_method: string;

  @Column({
    default: 'init',
    type: 'enum',
    enum: StatusType,
  })
  status: StatusType;

  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'customer_name',
  })
  customerName: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
