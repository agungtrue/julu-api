import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { IngredientMutation } from './entities/ingredient-mutation.entity';
import { IngredientMutationService } from './ingredient-mutations.service';
import { IngredientMutationController } from './ingredient-mutations.controller';
import { IngredientsModule } from '../ingredients/ingredients.module';

@Module({
  imports: [
    IngredientsModule,
    TypeOrmModule.forFeature([Ingredient, IngredientMutation]),
  ],
  controllers: [IngredientMutationController],
  providers: [IngredientMutationService],
  exports: [IngredientMutationService],
})
export class IngredientMutationsModule {}
