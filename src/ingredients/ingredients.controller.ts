import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  createIngredient(
    @Body()
    data: {
      name: string;
      purchase_cost: number;
      conversion_factor: number;
      unit: string;
    },
  ) {
    return this.ingredientsService.createIngredient(data);
  }

  @Get()
  findAllIngredients() {
    return this.ingredientsService.findAllIngredients();
  }

  @Patch(':id')
  updateIngredient(
    @Param('id') id: string,
    @Body()
    data: { name?: string; purchase_cost?: number; conversion_factor?: number },
  ) {
    return this.ingredientsService.updateIngredient(id, data);
  }

  @Delete(':id')
  removeIngredient(@Param('id') id: string) {
    return this.ingredientsService.removeIngredient(id);
  }

  // 2. Endpoint Formula Resep & HPP Calculator
  // Mengambil komposisi resep untuk modal detail di UI
  @Get('recipe/:productId')
  getRecipe(@Param('productId') productId: number) {
    return this.ingredientsService.getRecipeByProduct(productId);
  }

  // Submit handler utama untuk simpan/update resep dari UI
  @Post('recipe')
  saveRecipe(
    @Body()
    data: {
      product_id: number;
      ingredients: { ingredient_id: string; qty_used: number }[];
    },
  ) {
    return this.ingredientsService.saveProductRecipe(
      data.product_id,
      data.ingredients,
    );
  }
}
