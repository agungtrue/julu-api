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
import { Ingredient } from './ingredient.entity';
import { Product } from '../../products/products.entity';
import { Tenant } from '../../tenants/tenants.entity';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value) || 0,
};

@Entity('product_ingredients')
@Index(['tenantId', 'product_id'])
export class ProductIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  product_id: string;

  @Column({ type: 'uuid' })
  ingredient_id: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  qty_used: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  sub_total_cost: number;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Product, (product) => product.productIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
