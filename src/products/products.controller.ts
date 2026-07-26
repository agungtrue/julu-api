import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('products')
@RequireSubscription()
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get('/')
  list(
    @Query('withIngredients') withIngredients: boolean,
    @CurrentUser() user: any,
  ): object {
    if (user?.userRole === 'SUPER_ADMIN') {
      return [];
    }
    return this.productService.findAll(withIngredients, user);
  }

  @Post('/')
  async create(
    @Body() body: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<object> {
    console.log({ user })
    if (user?.userRole === 'SUPER_ADMIN') {
      throw new HttpException(
        'You cannot perform this action',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.productService.create(body, user);
  }
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: CreateProductDto,
  ): Promise<object> {
    return await this.productService.update(id, body);
  }
}
