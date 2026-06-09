import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemsModule } from './order_items/order_items.module';
import { CustomersModule } from './customers/customers.module';
import { OutletsModule } from './outlets/outlets.module';
import { join } from 'path';
import { dbConfig, envMode } from '../db.config'
import { AuthModule } from './auth/auth.module';
import { PromotionsModule } from './promotions/promotions.module';

console.log('app.module...', { envMode })

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ...(envMode !== 'local' && {
        envFilePath: join(process.cwd(), envMode === 'development' ? '.env.development' : '.env.production')
      }),
    }),
    TypeOrmModule.forRoot(
      dbConfig()),
      ProductsModule,
      UsersModule,
      OrdersModule,
      OrderItemsModule,
      CustomersModule,
      OutletsModule,
      AuthModule,
      PromotionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}