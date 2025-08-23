import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto'

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get('/')
  list(): object {
    return this.productService.findAll();
  }

  @Post('/')
  async create(
    @Body() body: CreateProductDto,
  ): Promise<object> {
    return await this.productService.create(body);
  }
}
