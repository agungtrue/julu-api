import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '../orders/orders.entity';
import { Product } from '../products/products.entity';
import { Tenant } from '../tenants/tenants.entity';

@Entity('order_items')
@Index(['tenantId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column('int')
  qty: number;

  @Column({ type: 'integer' })
  price: number;

  @Column({ type: 'integer', nullable: true, default: null })
  adjustedPrice: number;

  @Column()
  subtotal: number;

  @Column({ default: false })
  hasPromo: boolean;

  @Column({ type: 'integer', default: 0 })
  appliedPromoCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
