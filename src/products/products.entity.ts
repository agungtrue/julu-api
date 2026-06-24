import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from 'typeorm';
import { OrderItem } from '../order_items/order_items.entity';
import { ProductType } from './enums/product.enum';
import { SizeType } from './enums/size.enum';
import { ProductIngredient } from '../ingredients/entities/product-ingredient.entity';

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

  @OneToMany(() => ProductIngredient, (item) => item.product, { cascade: true })
  productIngredients: ProductIngredient[];
}
