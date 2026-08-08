import {
  Entity,
  Index,
  BeforeInsert,
  BeforeUpdate,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh_tokens.entity';
import { Outlet } from '../outlets/outlets.entity';
import { Order } from '../orders/orders.entity';
import { Tenant } from '../tenants/tenants.entity';
import { IngredientMutation } from '../ingredient-mutations/entities/ingredient-mutation.entity'
import * as bcrypt from 'bcrypt';

@Entity('users')
@Index(['tenantId'])
@Index(['tenantId', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 20, default: 'EMPLOYEE' })
  role: string;

  @Column({ default: true })
  mustChangePassword: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ type: 'varchar', length: 6, nullable: true })
  pin: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_token: RefreshToken[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @ManyToOne(() => Outlet, (outlet) => outlet.user)
  outlet: Outlet[];

  @Column({ nullable: true })
  outletId: number;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => IngredientMutation, (mutation) => mutation.user)
  mutations: IngredientMutation[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
      const saltRounds = 10;
      this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
    }
  }
}
