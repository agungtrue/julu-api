import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { Order } from '../orders/orders.entity'
import { Promotion } from './promotions.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, Order])],
  providers: [PromotionsService],
  controllers: [PromotionsController]
})
export class PromotionsModule {}
