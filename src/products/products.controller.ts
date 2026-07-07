import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get('/')
  list(@Query('withIngredients') withIngredients: boolean): object {
    return this.productService.findAll(withIngredients);
  }

  @Post('/')
  async create(@Body() body: CreateProductDto): Promise<object> {
    return await this.productService.create(body);
  }
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateProductDto,
  ): Promise<object> {
    return await this.productService.update(id, body);
  }
}
