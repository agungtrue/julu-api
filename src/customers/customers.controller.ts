import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto'
@Controller('customers')
export class CustomersController {
  constructor(private readonly customerService: CustomersService) {}

  @Get('/')
  list(
    // @Query('page') page: string,
    // @Query('limit') limit: string,
    @Query('search') search: string,
  ): object {
    return this.customerService.findAll(search);
  }

  @Post('/')
  async create(
    @Body() body: CreateCustomerDto,
  ): Promise<object> {
    return await this.customerService.create(body)
  }
}
