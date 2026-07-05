import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { Customer } from '../../customers/customers.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_type: 'user' | 'customer';

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ type: 'text', unique: true })
  refresh_token: string;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
