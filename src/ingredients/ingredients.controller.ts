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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('ingredients')
@RequireSubscription()
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
    @CurrentUser() user: any,
  ) {
    return this.ingredientsService.createIngredient(data, user);
  }

  @Get()
  findAllIngredients(@CurrentUser() user: any) {
    if (user?.userRole === 'SUPER_ADMIN') {
      return [];
    }
    return this.ingredientsService.findAllIngredients(user);
  }

  @Patch(':id')
  updateIngredient(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      purchase_cost?: number;
      conversion_factor?: number;
      stock?: number;
      minimumStock?: number;
    },
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
  getRecipe(@Param('productId') productId: string) {
    return this.ingredientsService.getRecipeByProduct(productId);
  }

  // Submit handler utama untuk simpan/update resep dari UI
  @Post('recipe')
  saveRecipe(
    @Body()
    data: {
      product_id: string;
      ingredients: { ingredient_id: string; qty_used: number }[];
    },
    @CurrentUser() user: any,
  ) {
    return this.ingredientsService.saveProductRecipe(
      data.product_id,
      data.ingredients,
      user,
    );
  }
}
