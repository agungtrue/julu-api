import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products.entity';
import { OrderItem } from '../order_items/order_items.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Tenant } from 'src/tenants/tenants.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, OrderItem, Tenant])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
