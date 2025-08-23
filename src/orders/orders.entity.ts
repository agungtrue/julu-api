import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Customer } from '../customers/customers.entity';
import { Outlet } from '../outlets/outlets.entity';
import { OrderItem } from '../order_items/order_items.entity';
import { StatusType } from './enums/status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ nullable: true })
  customerId: number;

  @ManyToOne(() => Outlet, (outlet) => outlet.order)
  @JoinColumn({ name: 'outletId' })
  outlet: Outlet;

  @Column({ nullable: true })
  outletId: number

  @Column()
  total: number;

  @Column({ default: 'cash' })
  payment_method: string;

  @Column({
    default: 'init',
    type: 'enum',
    enum: StatusType,
  })
  status: StatusType;

  @Column({ unique: true })
  uuid: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}