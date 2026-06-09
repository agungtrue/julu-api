import { Entity, BeforeInsert, BeforeUpdate, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh_tokens.entity';
import { Outlet } from '../outlets/outlets.entity'
import { Order } from '../orders/orders.entity';
import * as bcrypt from "bcrypt";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password_hash: string;

  @Column()
  phone: string;

  @Column({ default: true })
  isActive: boolean;

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

  @BeforeInsert()
  @BeforeUpdate()

  async hashPassword() {
    if (this.password_hash && !this.password_hash.startsWith("$2b$")) {
      const saltRounds = 10;
      this.password_hash = await bcrypt.hash(this.password_hash, saltRounds);
    }
  }
}