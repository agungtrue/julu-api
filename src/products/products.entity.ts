import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from '../order_items/order_items.entity';
import { ProductType } from './enums/product.enum';
import { SizeType } from './enums/size.enum';
import { ProductIngredient } from '../ingredients/entities/product-ingredient.entity';
import { Tenant } from '../tenants/tenants.entity';
@Entity('products')
@Index(['tenantId'])
@Index(['tenantId', 'id'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({
    type: 'enum',
    enum: ProductType,
  })
  type: ProductType;

  @Column({
    type: 'enum',
    enum: SizeType,
  })
  size: SizeType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'integer', nullable: true })
  cogs: number;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => OrderItem, (item) => item.product, { cascade: true })
  orderItems: OrderItem[];

  @OneToMany(() => ProductIngredient, (item) => item.product, { cascade: true })
  productIngredients: ProductIngredient[];
}
