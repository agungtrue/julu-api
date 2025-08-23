import { Controller, Query, Get, Body, Post, HttpException, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { v4 as uuidv4 } from 'uuid';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Get('/')
  list(
    @Query('search') search: string,
    @Query('status') status: string,
  ): object {
    return this.orderService.findAll(search, status);
  }

  @Post('/init')
  async init(
    @Body() body: CreateOrderDto,
  ): Promise<object> {
    const uuid = uuidv4();
    body.uuid = uuid
    await this.orderService.create(body)

    return { orderUuid: uuid };
  }

  @Post('/confirm')
  async confirm(
    @Body() body: CreateOrderDto,
  ): Promise<object> {
    const isValid = await this.orderService.validate(body.uuid)
    if (isValid) {
        return await this.orderService.confirm(body)
    }

    throw new HttpException('something when wrong!', HttpStatus.NOT_FOUND)
  }

}
