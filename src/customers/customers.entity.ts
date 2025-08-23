import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from '../orders/orders.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string | null;

  @Column()
  phone: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}