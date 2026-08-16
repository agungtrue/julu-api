import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';
import { User } from '../../users/users.entity';
import { StockMutationType } from '../stock-mutation-type.enum';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value) || 0,
};

@Entity('ingredient_mutations')
@Index(['tenantId', 'ingredientId'])
@Index(['tenantId', 'createdAt'])
export class IngredientMutation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  ingredientId: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.mutations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  @ManyToOne(() => User, (user) => user.mutations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'createdById' })
  user: User;

  @Column({
    type: 'enum',
    enum: StockMutationType,
  })
  type: StockMutationType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  previousStock: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  currentStock: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  cost_per_unit: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  totalCost: number;

  // Referensi (e.g., ID Order / No. Invoice Supplier)
  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
