import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, Column } from 'typeorm';
import { OrderItem } from '../order_items/order_items.entity'
import { ProductType } from './enums/product.enum'
import { SizeType } from './enums/size.enum'

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
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

  @Column({ nullable: true })
  cogs: number;

  @OneToMany(() => OrderItem, (item) => item.product, { cascade: true })
  orderItems: OrderItem[];
}