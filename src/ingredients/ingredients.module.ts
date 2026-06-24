import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { Ingredient } from './entities/ingredient.entity';
import { ProductIngredient } from './entities/product-ingredient.entity';
import { ProductsModule } from '../products/products.module';
import { Product } from '../products/products.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, ProductIngredient, Product]),
    ProductsModule,
  ],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
