import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  UpdateDateColumn,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Order } from '../orders/orders.entity';
import { RefreshToken } from '../auth/entities/refresh_tokens.entity';
import * as bcrypt from 'bcrypt';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email?: string | null;

  @Column()
  password_hash: string;

  @Column({ unique: true })
  phone: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RefreshToken, (token) => token.customer)
  refresh_token: RefreshToken[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
      const saltRounds = 10;
      this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
    }
  }
}
