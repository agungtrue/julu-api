import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  Column,
} from 'typeorm';
import { Order } from '../orders/orders.entity';
import { User } from '../users/users.entity';

@Entity('outlets')
export class Outlet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  branch: string;

  @Column()
  address: string;

  @Column()
  pic: string; // next relation into users

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Order, (item) => item.outlet)
  order: Order[];

  @OneToMany(() => User, (item) => item.outlet)
  user: User[];
}
