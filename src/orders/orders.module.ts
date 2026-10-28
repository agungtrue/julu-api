import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './orders.entity';
import { OrderItem } from '../order_items/order_items.entity';
import { Outlet } from 'src/outlets/outlets.entity';
import { Promotion } from 'src/promotions/promotions.entity';
import { Tenant } from 'src/tenants/tenants.entity';
import { Ingredient } from 'src/ingredients/entities/ingredient.entity';
import { IngredientMutationsModule } from 'src/ingredient-mutations/ingredient-mutations.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Outlet,
      Promotion,
      Tenant,
      Ingredient,
    ]),
    IngredientMutationsModule,
    DashboardModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
