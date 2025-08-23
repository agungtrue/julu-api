import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './orders.entity'
import { OrderItem } from '../order_items/order_items.entity'
import { Outlet } from 'src/outlets/outlets.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Outlet])],
  providers: [OrdersService],
  controllers: [OrdersController]
})
export class OrdersModule {}
